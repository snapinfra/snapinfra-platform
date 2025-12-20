"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Trash2,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Loader2,
    Terminal,
    Info
} from "lucide-react"

const BACKEND_URL = "http://localhost:3001"
const STATIC_USER_ID = 'user_35D1LiK0985qSJCacutmHh73oxA' // Fallback user ID

interface DestroyModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectId: string
    projectName: string
    userId?: string
    deployment: any
    onDestroyComplete?: () => void
}

interface LogEntry {
    timestamp: string
    level: string
    message: string
}

export function DestroyModal({
    open,
    onOpenChange,
    projectId,
    projectName,
    userId,
    deployment,
    onDestroyComplete
}: DestroyModalProps) {
    const [step, setStep] = useState<'confirm' | 'credentials' | 'destroying'>('confirm')
    const [confirmed, setConfirmed] = useState(false)
    const [accessKeyId, setAccessKeyId] = useState('')
    const [secretAccessKey, setSecretAccessKey] = useState('')
    const [sessionToken, setSessionToken] = useState('')
    const [region, setRegion] = useState('us-east-1')
    const [destroying, setDestroying] = useState(false)
    const [destroyStatus, setDestroyStatus] = useState<'idle' | 'in-progress' | 'success' | 'failed'>('idle')
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [error, setError] = useState<string | null>(null)
    const [currentStep, setCurrentStep] = useState('')
    const [duration, setDuration] = useState('')

    const wsRef = useRef<WebSocket | null>(null)
    const logsEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setStep('confirm')
                setConfirmed(false)
                setAccessKeyId('')
                setSecretAccessKey('')
                setSessionToken('')
                setDestroying(false)
                setDestroyStatus('idle')
                setLogs([])
                setError(null)
                setCurrentStep('')
                setDuration('')
            }, 300)
        }
    }, [open])

    // Cleanup WebSocket on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close()
            }
        }
    }, [])

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
        if (!accessKeyId || !secretAccessKey) {
            setError('AWS credentials are required')
            return
        }

        // Use provided userId or fallback to static user ID
        const effectiveUserId = userId || STATIC_USER_ID

        setDestroying(true)
        setDestroyStatus('in-progress')
        setStep('destroying')
        setError(null)
        setLogs([])

        try {
            // Step 1: Initiate destroy via REST API
            addLog('info', 'Initiating destruction...')
            addLog('info', `Using User ID: ${effectiveUserId}`)

            const response = await fetch(`${BACKEND_URL}/api/destroy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: effectiveUserId,
                    projectId,
                    projectName,
                    accessKeyId,
                    secretAccessKey,
                    sessionToken: sessionToken || undefined,
                    region
                })
            })

            if (!response.ok) {
                throw new Error('Failed to initiate destruction')
            }

            const data = await response.json()
            addLog('success', `Destruction initiated: ${data.deploymentId}`)

            // Step 2: Connect to WebSocket for real-time updates
            const wsUrl = `ws://localhost:3001/ws/destroy/${data.deploymentId}`
            addLog('info', `Connecting to WebSocket: ${wsUrl}`)

            const ws = new WebSocket(wsUrl)
            wsRef.current = ws

            ws.onopen = () => {
                addLog('success', 'WebSocket connected')

                // Send start signal with parameters
                ws.send(JSON.stringify({
                    type: 'start_deployment',
                    params: {
                        userId: effectiveUserId,
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

                            // Close WebSocket
                            setTimeout(() => {
                                ws.close()
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
                                ws.close()
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
            case 'error': return 'text-red-600'
            case 'warn': return 'text-yellow-600'
            case 'success': return 'text-green-600'
            case 'info': return 'text-blue-600'
            default: return 'text-gray-600'
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
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

                <div className="flex-1 overflow-y-auto">
                    {/* Step 1: Confirmation */}
                    {step === 'confirm' && (
                        <div className="space-y-6">
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Warning:</strong> This action cannot be undone. All resources will be permanently deleted.
                                </AlertDescription>
                            </Alert>

                            {deployment && (
                                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-semibold text-sm">Deployment Details</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-500">Project</p>
                                            <p className="font-medium">{projectName}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Region</p>
                                            <p className="font-medium">{deployment.region}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Status</p>
                                            <Badge variant="outline">{deployment.status}</Badge>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Created</p>
                                            <p className="font-medium">
                                                {new Date(deployment.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    {deployment.url && (
                                        <div>
                                            <p className="text-gray-500 text-sm">URL</p>
                                            <code className="text-xs bg-white px-2 py-1 rounded block mt-1">
                                                {deployment.url}
                                            </code>
                                        </div>
                                    )}
                                </div>
                            )}

                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    The following resources will be destroyed:
                                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                                        <li>ECS Services and Tasks</li>
                                        <li>Application Load Balancer</li>
                                        <li>Target Groups</li>
                                        <li>ECR Repositories and Images</li>
                                        <li>CloudWatch Log Groups</li>
                                        <li>All associated infrastructure</li>
                                    </ul>
                                </AlertDescription>
                            </Alert>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="confirm"
                                    checked={confirmed}
                                    onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                                />
                                <label
                                    htmlFor="confirm"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    I understand that this action cannot be undone
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Step 2: AWS Credentials */}
                    {step === 'credentials' && (
                        <div className="space-y-4">
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    Your AWS credentials are required to destroy the infrastructure. They are used only for this operation and are not stored.
                                </AlertDescription>
                            </Alert>

                            {!userId && (
                                <Alert className="border-yellow-200 bg-yellow-50">
                                    <Info className="h-4 w-4 text-yellow-600" />
                                    <AlertDescription className="text-yellow-800">
                                        Using default user ID: {STATIC_USER_ID}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="accessKeyId">AWS Access Key ID *</Label>
                                    <Input
                                        id="accessKeyId"
                                        type="text"
                                        value={accessKeyId}
                                        onChange={(e) => setAccessKeyId(e.target.value)}
                                        placeholder="AKIAIOSFODNN7EXAMPLE"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="secretAccessKey">AWS Secret Access Key *</Label>
                                    <Input
                                        id="secretAccessKey"
                                        type="password"
                                        value={secretAccessKey}
                                        onChange={(e) => setSecretAccessKey(e.target.value)}
                                        placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sessionToken">AWS Session Token (Optional)</Label>
                                    <Input
                                        id="sessionToken"
                                        type="password"
                                        value={sessionToken}
                                        onChange={(e) => setSessionToken(e.target.value)}
                                        placeholder="Optional for temporary credentials"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="region">AWS Region *</Label>
                                    <Select value={region} onValueChange={setRegion}>
                                        <SelectTrigger>
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

                    {/* Step 3: Destroying */}
                    {step === 'destroying' && (
                        <div className="space-y-4">
                            {/* Status Header */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    {destroyStatus === 'in-progress' && (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                            <div>
                                                <p className="font-semibold text-sm">Destroying...</p>
                                                <p className="text-xs text-gray-600">{currentStep}</p>
                                            </div>
                                        </>
                                    )}
                                    {destroyStatus === 'success' && (
                                        <>
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                            <div>
                                                <p className="font-semibold text-sm text-green-600">Destruction Completed!</p>
                                                <p className="text-xs text-gray-600">Duration: {duration}</p>
                                            </div>
                                        </>
                                    )}
                                    {destroyStatus === 'failed' && (
                                        <>
                                            <XCircle className="w-5 h-5 text-red-600" />
                                            <div>
                                                <p className="font-semibold text-sm text-red-600">Destruction Failed</p>
                                                <p className="text-xs text-gray-600">Duration: {duration}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Logs */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-gray-500" />
                                    <Label>Destruction Logs</Label>
                                </div>
                                <div className="bg-black text-white p-4 rounded-lg h-[400px] overflow-y-auto font-mono text-xs">
                                    {logs.map((log, index) => (
                                        <div key={index} className="mb-1">
                                            <span className="text-gray-400">[{log.timestamp}]</span>{' '}
                                            <span className={getLogColor(log.level)}>
                                                {log.message}
                                            </span>
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

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={destroying}
                    >
                        {destroyStatus === 'success' ? 'Close' : 'Cancel'}
                    </Button>

                    <div className="flex items-center gap-2">
                        {step === 'confirm' && (
                            <Button
                                variant="destructive"
                                onClick={handleConfirm}
                                disabled={!confirmed}
                                className="gap-2"
                            >
                                <AlertTriangle className="w-4 h-4" />
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
                                    disabled={!accessKeyId || !secretAccessKey || destroying}
                                    className="gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Destroy Infrastructure
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}