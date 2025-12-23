"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, AlertTriangle, CheckCircle, XCircle, Loader2, Terminal, Info } from "lucide-react"
import { useDeploymentManager } from "./deployment-manager"

const BACKEND_URL = "http://localhost:3001"

interface DestroyModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectId: string
    projectName: string
    deployment: any
    onDestroyComplete?: () => void
}

export function DestroyModal({
    open,
    onOpenChange,
    projectId,
    projectName,
    deployment,
    onDestroyComplete
}: DestroyModalProps) {
    const { user, isLoaded } = useUser()
    const { currentDeployment } = useDeploymentManager()

    const [step, setStep] = useState<'confirm' | 'credentials' | 'destroying'>('confirm')
    const [confirmed, setConfirmed] = useState(false)
    const [accessKeyId, setAccessKeyId] = useState('')
    const [secretAccessKey, setSecretAccessKey] = useState('')
    const [sessionToken, setSessionToken] = useState('')
    const [region, setRegion] = useState('us-east-1')
    const [destroying, setDestroying] = useState(false)
    const [destroyStatus, setDestroyStatus] = useState<'idle' | 'in-progress' | 'success' | 'failed'>('idle')
    const [logs, setLogs] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)
    const [currentStep, setCurrentStep] = useState('')
    const [duration, setDuration] = useState('')
    const [destroymentId, setDestroymentId] = useState<string | null>(null)

    const wsRef = useRef<WebSocket | null>(null)
    const logsEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setStep('confirm')
                setConfirmed(false)
                setAccessKeyId('')
                setSecretAccessKey('')
                setSessionToken('')
                if (destroyStatus === 'success' || destroyStatus === 'failed') {
                    setDestroying(false)
                    setDestroyStatus('idle')
                    setLogs([])
                    setError(null)
                    setCurrentStep('')
                    setDuration('')
                    setDestroymentId(null)
                }
            }, 300)
        }
    }, [open, destroyStatus])

    const addLog = (level: string, message: string) => {
        setLogs(prev => [...prev, {
            timestamp: new Date().toLocaleTimeString(),
            level,
            message
        }])
    }

    const handleConfirm = () => {
        if (confirmed) {
            setStep('credentials')
        }
    }

    const handleDestroy = async () => {
        if (!isLoaded) {
            setError('Loading user authentication...')
            return
        }

        if (!user) {
            setError('You must be logged in to perform this action')
            return
        }

        if (!accessKeyId || !secretAccessKey) {
            setError('AWS credentials are required')
            return
        }

        const userId = user.id

        setDestroying(true)
        setDestroyStatus('in-progress')
        setStep('destroying')
        setError(null)
        setLogs([])

        try {
            addLog('info', 'Initiating destruction...')
            addLog('info', `User ID: ${userId}`)
            addLog('info', `Project: ${projectName}`)

            const response = await fetch(`${BACKEND_URL}/api/destroy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    projectId,
                    projectName,
                    accessKeyId,
                    secretAccessKey,
                    sessionToken: sessionToken || undefined,
                    region
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Failed to initiate destruction')
            }

            const data = await response.json()
            const depId = data.deploymentId
            setDestroymentId(depId)
            addLog('success', `Destruction initiated: ${depId}`)

            const wsUrl = `ws://localhost:3001/ws/destroy/${depId}`
            addLog('info', `Connecting to WebSocket...`)

            const ws = new WebSocket(wsUrl)
            wsRef.current = ws

            ws.onopen = () => {
                addLog('success', 'WebSocket connected')
                ws.send(JSON.stringify({
                    type: 'start_deployment',
                    params: {
                        userId,
                        projectId,
                        projectName,
                        accessKeyId,
                        secretAccessKey,
                        sessionToken: sessionToken || undefined,
                        region
                    }
                }))
            }

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data)

                    switch (message.type) {
                        case 'connected':
                            addLog('info', message.message)
                            break

                        case 'started':
                            addLog('info', message.message)
                            setCurrentStep('Destruction started')
                            break

                        case 'log':
                            addLog(message.level || 'info', message.message)
                            break

                        case 'progress':
                            addLog('info', `[${message.step}] ${message.message}`)
                            setCurrentStep(message.message)
                            if (message.status === 'failed' && message.error) {
                                addLog('error', `Error: ${message.error}`)
                            }
                            break

                        case 'completed':
                            addLog('success', `✓ ${message.message}`)
                            setDestroyStatus('success')
                            setDestroying(false)
                            setDuration(message.duration || '')
                            // Don't close WebSocket immediately - let user see completion
                            setTimeout(() => {
                                if (wsRef.current) {
                                    wsRef.current.close()
                                }
                                if (onDestroyComplete) {
                                    onDestroyComplete()
                                }
                            }, 2000)
                            break

                        case 'failed':
                            addLog('error', `✗ Destruction failed: ${message.error}`)
                            setDestroyStatus('failed')
                            setError(message.error)
                            setDestroying(false)
                            setDuration(message.duration || '')
                            setTimeout(() => {
                                if (wsRef.current) {
                                    wsRef.current.close()
                                }
                            }, 1000)
                            break

                        case 'error':
                            addLog('error', message.message)
                            setError(message.message)
                            break
                    }
                } catch (err) {
                    console.error('Failed to parse WebSocket message:', err)
                }
            }

            ws.onerror = (error) => {
                addLog('error', 'WebSocket connection error')
                setDestroyStatus('failed')
                setError('WebSocket connection failed')
                setDestroying(false)
            }

            ws.onclose = () => {
                addLog('info', 'WebSocket disconnected')
                wsRef.current = null
            }

        } catch (err: any) {
            addLog('error', err.message)
            setError(err.message)
            setDestroyStatus('failed')
            setDestroying(false)
        }
    }

    const getLogColor = (level: string) => {
        switch (level) {
            case 'error':
                return 'text-red-600'
            case 'warn':
                return 'text-yellow-600'
            case 'success':
                return 'text-green-600'
            case 'info':
                return 'text-blue-600'
            default:
                return 'text-gray-600'
        }
    }

    if (!isLoaded) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl">
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        <span className="ml-3 text-gray-600">Loading...</span>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (!user) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Authentication Required</DialogTitle>
                        <DialogDescription>
                            You must be logged in to destroy deployments
                        </DialogDescription>
                    </DialogHeader>
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Please log in to continue with this action.
                        </AlertDescription>
                    </Alert>
                    <div className="flex justify-end">
                        <Button onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-red-600" />
                        Destroy Deployment
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'confirm' && 'Confirm that you want to destroy this deployment'}
                        {step === 'credentials' && 'Enter your AWS credentials to destroy the infrastructure'}
                        {step === 'destroying' && 'Destroying infrastructure...'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {step === 'confirm' && (
                        <div className="space-y-4">
                            <Alert className="border-red-200 bg-red-50">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-800">
                                    <strong>Warning:</strong> This action cannot be undone. All resources will be permanently deleted.
                                </AlertDescription>
                            </Alert>

                            {deployment && (
                                <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                                    <h4 className="font-semibold text-sm text-gray-700">Deployment Details</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-500">Project:</span>
                                            <p className="font-medium">{projectName}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Region:</span>
                                            <p className="font-medium">{deployment.region}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Status:</span>
                                            <p>
                                                <Badge variant={deployment.status === 'deployed' ? 'default' : 'secondary'}>
                                                    {deployment.status}
                                                </Badge>
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Created:</span>
                                            <p className="font-medium">{new Date(deployment.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        {deployment.url && (
                                            <div className="col-span-2">
                                                <span className="text-gray-500">URL:</span>
                                                <p className="font-medium text-blue-600 truncate">{deployment.url}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="border rounded-lg p-4 bg-gray-50">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                    The following resources will be destroyed:
                                </p>
                                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                                    <li>ECS Services and Tasks</li>
                                    <li>Application Load Balancer</li>
                                    <li>Target Groups</li>
                                    <li>ECR Repositories and Images</li>
                                    <li>CloudWatch Log Groups</li>
                                    <li>All associated infrastructure</li>
                                </ul>
                            </div>

                            <div className="flex items-start space-x-2 pt-2">
                                <Checkbox
                                    id="confirm"
                                    checked={confirmed}
                                    onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                                />
                                <Label
                                    htmlFor="confirm"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    I understand that this action cannot be undone
                                </Label>
                            </div>
                        </div>
                    )}

                    {step === 'credentials' && (
                        <div className="space-y-4">
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    Your AWS credentials are required to destroy the infrastructure. They are used only for this operation and are not stored.
                                </AlertDescription>
                            </Alert>

                            <Alert className="border-blue-200 bg-blue-50">
                                <Info className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-blue-800">
                                    <strong>Authenticated as:</strong> {user.primaryEmailAddress?.emailAddress || user.id}
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="accessKeyId">
                                        AWS Access Key ID <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="accessKeyId"
                                        type="text"
                                        value={accessKeyId}
                                        onChange={(e) => setAccessKeyId(e.target.value)}
                                        placeholder="AKIAIOSFODNN7EXAMPLE"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="secretAccessKey">
                                        AWS Secret Access Key <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="secretAccessKey"
                                        type="password"
                                        value={secretAccessKey}
                                        onChange={(e) => setSecretAccessKey(e.target.value)}
                                        placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="sessionToken">
                                        AWS Session Token (Optional)
                                    </Label>
                                    <Input
                                        id="sessionToken"
                                        type="password"
                                        value={sessionToken}
                                        onChange={(e) => setSessionToken(e.target.value)}
                                        placeholder="Optional for temporary credentials"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="region">
                                        AWS Region <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={region} onValueChange={setRegion}>
                                        <SelectTrigger id="region">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                                            <SelectItem value="us-east-2">US East (Ohio)</SelectItem>
                                            <SelectItem value="us-west-1">US West (N. California)</SelectItem>
                                            <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                                            <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                                            <SelectItem value="eu-central-1">EU (Frankfurt)</SelectItem>
                                            <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                                            <SelectItem value="ap-northeast-1">Asia Pacific (Tokyo)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <XCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}

                    {step === 'destroying' && (
                        <div className="space-y-4">
                            {(destroyStatus === 'in-progress' || destroying) && (
                                <Alert className="border-blue-200 bg-blue-50">
                                    <Info className="h-4 w-4 text-blue-600" />
                                    <AlertDescription className="text-blue-800">
                                        <strong>Note:</strong> This destruction will continue in the background even if you close this modal.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="border rounded-lg p-4 bg-gray-50">
                                {destroyStatus === 'in-progress' && (
                                    <>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                            <span className="font-semibold text-gray-900">Destroying...</span>
                                        </div>
                                        <p className="text-sm text-gray-600">{currentStep}</p>
                                    </>
                                )}

                                {destroyStatus === 'success' && (
                                    <>
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                            <span className="font-semibold text-gray-900">Destruction Completed!</span>
                                        </div>
                                        <p className="text-sm text-gray-600">Duration: {duration}</p>
                                    </>
                                )}

                                {destroyStatus === 'failed' && (
                                    <>
                                        <div className="flex items-center gap-2 mb-2">
                                            <XCircle className="w-5 h-5 text-red-600" />
                                            <span className="font-semibold text-gray-900">Destruction Failed</span>
                                        </div>
                                        <p className="text-sm text-gray-600">Duration: {duration}</p>
                                    </>
                                )}
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-gray-800 text-white px-4 py-2 flex items-center gap-2">
                                    <Terminal className="w-4 h-4" />
                                    <span className="text-sm font-medium">Destruction Logs</span>
                                </div>
                                <div className="bg-gray-900 text-gray-100 p-4 font-mono text-xs h-64 overflow-y-auto">
                                    {logs.map((log, index) => (
                                        <div key={index} className="mb-1">
                                            <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                                            <span className={getLogColor(log.level)}>{log.message}</span>
                                        </div>
                                    ))}
                                    <div ref={logsEndRef} />
                                </div>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <XCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={destroying && destroyStatus === 'in-progress'}
                    >
                        {destroyStatus === 'in-progress' ? 'Close' : destroyStatus === 'success' ? 'Close' : 'Cancel'}
                    </Button>

                    {step === 'confirm' && (
                        <Button
                            variant="destructive"
                            onClick={handleConfirm}
                            disabled={!confirmed}
                        >
                            Continue
                        </Button>
                    )}

                    {step === 'credentials' && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setStep('confirm')}
                                disabled={destroying}
                            >
                                Back
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDestroy}
                                disabled={destroying || !accessKeyId || !secretAccessKey}
                            >
                                {destroying ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Destroying...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Destroy Infrastructure
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}