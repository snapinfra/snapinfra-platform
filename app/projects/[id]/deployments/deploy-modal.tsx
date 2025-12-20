"use client"

import { useState, useEffect, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Rocket,
    CheckCircle,
    AlertCircle,
    Loader2,
    Terminal,
    X,
    Eye,
    EyeOff,
    ExternalLink,
    Copy,
    Check,
    Activity
} from "lucide-react"

interface DeployModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectId: string
    projectName: string
    userId?: string
    onDeploymentComplete: () => void
}

interface LogEntry {
    level: string
    message: string
    timestamp: string
}

interface ProgressStep {
    step: string
    status: string
    message: string
    data?: any
}

const BACKEND_URL = "http://localhost:3001"

export function DeployModal({ open, onOpenChange, projectId, projectName, userId, onDeploymentComplete }: DeployModalProps) {
    const [config, setConfig] = useState({
        userId: userId || "",
        projectId: projectId,
        accessKeyId: "",
        secretAccessKey: "",
        region: "us-east-1",
        sessionToken: "",
        projectName: projectName || ""
    })

    const [showSecrets, setShowSecrets] = useState(false)
    const [deploymentId, setDeploymentId] = useState<string | null>(null)
    const [status, setStatus] = useState<'idle' | 'connecting' | 'deploying' | 'success' | 'failed'>('idle')
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [progress, setProgress] = useState<ProgressStep[]>([])
    const [outputs, setOutputs] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [duration, setDuration] = useState<string>("")
    const [copied, setCopied] = useState<string | null>(null)

    const wsRef = useRef<WebSocket | null>(null)
    const logsEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    // Cleanup WebSocket on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close()
            }
        }
    }, [])

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            if (wsRef.current) {
                wsRef.current.close()
            }
            // Don't reset immediately to allow user to see results
            setTimeout(() => {
                if (!open) {
                    setStatus('idle')
                    setLogs([])
                    setProgress([])
                    setError(null)
                    setOutputs(null)
                    setDeploymentId(null)
                }
            }, 300)
        }
    }, [open])

    const handleInputChange = (name: string, value: string) => {
        setConfig(prev => ({ ...prev, [name]: value }))
    }

    const addLog = (level: string, message: string) => {
        setLogs(prev => [...prev, {
            level,
            message,
            timestamp: new Date().toLocaleTimeString()
        }])
    }

    const updateProgress = (progressData: ProgressStep) => {
        setProgress(prev => {
            const existing = prev.find(p => p.step === progressData.step)
            if (existing) {
                return prev.map(p => p.step === progressData.step ? progressData : p)
            }
            return [...prev, progressData]
        })
    }

    const handleWebSocketMessage = (message: any) => {
        switch (message.type) {
            case 'connected':
                addLog('info', message.message)
                break

            case 'started':
                addLog('success', `Deployment started: ${message.deploymentId}`)
                break

            case 'log':
                addLog(message.level, message.message)
                break

            case 'progress':
                updateProgress(message)
                addLog('info', `[${message.step}] ${message.message}`)
                break

            case 'completed':
                setStatus('success')
                setOutputs(message.outputs)
                setDuration(message.duration)
                addLog('success', `✓ Deployment completed in ${message.duration}`)
                if (wsRef.current) {
                    wsRef.current.close()
                }
                break

            case 'failed':
                setStatus('failed')
                setError(message.error)
                addLog('error', `✗ Deployment failed: ${message.error}`)
                if (wsRef.current) {
                    wsRef.current.close()
                }
                break

            case 'error':
                addLog('error', message.message)
                break
        }
    }

    const startDeployment = async () => {
        try {
            setLogs([])
            setProgress([])
            setError(null)
            setOutputs(null)
            setStatus('connecting')

            // Step 1: Initiate deployment via REST API
            const response = await fetch(`${BACKEND_URL}/api/deploy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error || 'Failed to initiate deployment')
            }

            const depId = data.deploymentId
            setDeploymentId(depId)
            addLog('info', `Deployment ID: ${depId}`)

            // Step 2: Connect to WebSocket
            const ws = new WebSocket(`${BACKEND_URL.replace('http', 'ws')}/ws/deploy/${depId}`)
            wsRef.current = ws

            ws.onopen = () => {
                addLog('info', 'Connected to deployment service')
                setStatus('deploying')

                // Send start command
                ws.send(JSON.stringify({
                    type: 'start_deployment',
                    params: config
                }))
            }

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data)
                handleWebSocketMessage(message)
            }

            ws.onerror = (error) => {
                addLog('error', 'WebSocket error occurred')
                setStatus('failed')
                setError('WebSocket connection failed')
            }

            ws.onclose = () => {
                addLog('info', 'WebSocket connection closed')
            }

            // onDeploymentComplete()

        } catch (err: any) {
            setError(err.message)
            setStatus('failed')
            addLog('error', err.message)
        }
    }

    const cancelDeployment = () => {
        if (wsRef.current) {
            wsRef.current.close()
        }
        setStatus('idle')
        addLog('warn', 'Deployment cancelled by user')
    }

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text)
        setCopied(key)
        setTimeout(() => setCopied(null), 2000)
    }

    const getLogColor = (level: string) => {
        switch (level) {
            case 'error': return 'text-red-600'
            case 'warn': return 'text-yellow-600'
            case 'success': return 'text-green-600'
            case 'stdout': return 'text-blue-600'
            case 'stderr': return 'text-orange-600'
            default: return 'text-gray-700'
        }
    }

    const getProgressIcon = (stepStatus: string) => {
        switch (stepStatus) {
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-500" />
            case 'failed':
                return <AlertCircle className="w-5 h-5 text-red-500" />
            case 'in-progress':
                return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            default:
                return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
        }
    }

    const isFormValid = config.userId && config.projectId && config.accessKeyId && config.secretAccessKey

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Rocket className="w-5 h-5" />
                        Deploy to AWS
                    </DialogTitle>
                    <DialogDescription>
                        Deploy {projectName} to AWS using ECS, ECR, and Terraform
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto">
                    {status === 'idle' && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="userId">User ID *</Label>
                                    <Input
                                        id="userId"
                                        value={config.userId}
                                        onChange={(e) => handleInputChange('userId', e.target.value)}
                                        placeholder="user-123"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="projectId">Project ID *</Label>
                                    <Input
                                        id="projectId"
                                        value={config.projectId}
                                        onChange={(e) => handleInputChange('projectId', e.target.value)}
                                        placeholder="project-456"
                                        disabled
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="accessKeyId">AWS Access Key ID *</Label>
                                    <div className="relative">
                                        <Input
                                            id="accessKeyId"
                                            type={showSecrets ? "text" : "password"}
                                            value={config.accessKeyId}
                                            onChange={(e) => handleInputChange('accessKeyId', e.target.value)}
                                            placeholder="AKIA..."
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3"
                                            onClick={() => setShowSecrets(!showSecrets)}
                                        >
                                            {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="secretAccessKey">AWS Secret Access Key *</Label>
                                    <Input
                                        id="secretAccessKey"
                                        type={showSecrets ? "text" : "password"}
                                        value={config.secretAccessKey}
                                        onChange={(e) => handleInputChange('secretAccessKey', e.target.value)}
                                        placeholder="Secret key"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="region">AWS Region</Label>
                                    <Select value={config.region} onValueChange={(value) => handleInputChange('region', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                                            <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                                            <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                                            <SelectItem value="ap-south-1">Asia Pacific (Mumbai)</SelectItem>
                                            <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="projectName">Project Name</Label>
                                    <Input
                                        id="projectName"
                                        value={config.projectName}
                                        onChange={(e) => handleInputChange('projectName', e.target.value)}
                                        placeholder="my-app"
                                    />
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="sessionToken">Session Token (Optional)</Label>
                                    <Input
                                        id="sessionToken"
                                        type={showSecrets ? "text" : "password"}
                                        value={config.sessionToken}
                                        onChange={(e) => handleInputChange('sessionToken', e.target.value)}
                                        placeholder="Session token for temporary credentials"
                                    />
                                </div>
                            </div>

                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Your AWS credentials are sent directly to the deployment service and are not stored.
                                    Make sure your IAM user has permissions for ECS, ECR, ALB, VPC, and CloudWatch.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {(status === 'connecting' || status === 'deploying' || status === 'success' || status === 'failed') && (
                        <div className="space-y-6 py-4">
                            {/* Progress Steps */}
                            {progress.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Activity className="w-4 h-4" />
                                        Deployment Progress
                                    </h3>
                                    <div className="space-y-2">
                                        {progress.map((step, index) => (
                                            <div key={step.step} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                {getProgressIcon(step.status)}
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm capitalize">
                                                        {step.step.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-xs text-gray-600">{step.message}</p>
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                    {step.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Deployment Outputs */}
                            {outputs && Object.keys(outputs).length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        Deployment Outputs
                                    </h3>
                                    <div className="space-y-2">
                                        {Object.entries(outputs).map(([key, data]: [string, any]) => {
                                            const value = data.value
                                            const isObject = typeof value === 'object' && value !== null
                                            const displayValue = isObject ? JSON.stringify(value, null, 2) : String(value)

                                            return (
                                                <div key={key} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="font-medium text-sm text-green-900">{key}</p>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(displayValue, key)}
                                                        >
                                                            {copied === key ? (
                                                                <Check className="w-3 h-3 text-green-600" />
                                                            ) : (
                                                                <Copy className="w-3 h-3" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                    {isObject ? (
                                                        <pre className="text-xs text-green-800 overflow-x-auto bg-green-100 p-2 rounded">
                                                            {displayValue}
                                                        </pre>
                                                    ) : (
                                                        <code className="text-xs text-green-800 break-all">
                                                            {displayValue}
                                                        </code>
                                                    )}
                                                    {key.includes('url') && !isObject && (
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            className="mt-2 h-auto p-0 text-green-700"
                                                            onClick={() => window.open(displayValue.startsWith('http') ? displayValue : `http://${displayValue}`, '_blank')}
                                                        >
                                                            <ExternalLink className="w-3 h-3 mr-1" />
                                                            Open in browser
                                                        </Button>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Error Display */}
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Logs */}
                            <div className="space-y-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Terminal className="w-4 h-4" />
                                    Deployment Logs
                                </h3>
                                <ScrollArea className="h-64 w-full rounded-lg border bg-gray-900 p-4">
                                    <div className="space-y-1 font-mono text-xs">
                                        {logs.map((log, index) => (
                                            <div key={index} className={getLogColor(log.level)}>
                                                <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                                                <span className="font-semibold">[{log.level.toUpperCase()}]</span>{' '}
                                                {log.message}
                                            </div>
                                        ))}
                                        <div ref={logsEndRef} />
                                    </div>
                                </ScrollArea>
                            </div>

                            {status === 'success' && duration && (
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                    <p className="font-semibold text-green-900">Deployment Successful!</p>
                                    <p className="text-sm text-green-700">Completed in {duration}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                        {deploymentId && (
                            <p className="text-xs text-gray-500">
                                Deployment ID: <code className="bg-gray-100 px-1 rounded">{deploymentId}</code>
                            </p>
                        )}
                        {status === 'deploying' && (
                            <p className="text-xs text-blue-600 flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Deployment in progress...
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {status === 'idle' && (
                            <>
                                <Button variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={startDeployment}
                                    disabled={!isFormValid}
                                    className="gap-2"
                                >
                                    <Rocket className="w-4 h-4" />
                                    Deploy Now
                                </Button>
                            </>
                        )}
                        {status === 'deploying' && (
                            <Button variant="destructive" onClick={cancelDeployment} className="gap-2">
                                <X className="w-4 h-4" />
                                Cancel Deployment
                            </Button>
                        )}
                        {(status === 'success' || status === 'failed') && (
                            <Button onClick={() => onOpenChange(false)}>
                                Close
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}