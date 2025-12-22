"use client"

import { createContext, useContext, useRef, useState, useCallback, ReactNode } from "react"

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

interface DeploymentState {
    deploymentId: string | null
    status: 'idle' | 'connecting' | 'deploying' | 'success' | 'failed'
    logs: LogEntry[]
    progress: ProgressStep[]
    outputs: any
    error: string | null
    duration: string
}

interface DeploymentManagerContextType {
    deployments: Map<string, DeploymentState>
    currentDeployment: DeploymentState | null
    startDeployment: (config: any) => Promise<string>
    cancelDeployment: (deploymentId: string) => void
    getDeployment: (deploymentId: string) => DeploymentState | undefined
    clearDeployment: (deploymentId: string) => void
}

const DeploymentManagerContext = createContext<DeploymentManagerContextType | null>(null)

const BACKEND_URL = "http://localhost:3001"

export function DeploymentManagerProvider({ children }: { children: ReactNode }) {
    const [deployments, setDeployments] = useState<Map<string, DeploymentState>>(new Map())
    const websockets = useRef<Map<string, WebSocket>>(new Map())

    const addLog = useCallback((deploymentId: string, level: string, message: string) => {
        setDeployments(prev => {
            const newMap = new Map(prev)
            const deployment = newMap.get(deploymentId)
            if (deployment) {
                deployment.logs.push({
                    level,
                    message,
                    timestamp: new Date().toLocaleTimeString()
                })
                newMap.set(deploymentId, { ...deployment })
            }
            return newMap
        })
    }, [])

    const updateProgress = useCallback((deploymentId: string, progressData: ProgressStep) => {
        setDeployments(prev => {
            const newMap = new Map(prev)
            const deployment = newMap.get(deploymentId)
            if (deployment) {
                const existing = deployment.progress.find(p => p.step === progressData.step)
                if (existing) {
                    deployment.progress = deployment.progress.map(p =>
                        p.step === progressData.step ? progressData : p
                    )
                } else {
                    deployment.progress.push(progressData)
                }
                newMap.set(deploymentId, { ...deployment })
            }
            return newMap
        })
    }, [])

    const updateDeployment = useCallback((deploymentId: string, updates: Partial<DeploymentState>) => {
        setDeployments(prev => {
            const newMap = new Map(prev)
            const deployment = newMap.get(deploymentId)
            if (deployment) {
                newMap.set(deploymentId, { ...deployment, ...updates })
            }
            return newMap
        })
    }, [])

    const handleWebSocketMessage = useCallback((deploymentId: string, message: any) => {
        switch (message.type) {
            case 'connected':
                addLog(deploymentId, 'info', message.message)
                break

            case 'started':
                addLog(deploymentId, 'success', `Deployment started: ${message.deploymentId}`)
                break

            case 'log':
                addLog(deploymentId, message.level, message.message)
                break

            case 'progress':
                updateProgress(deploymentId, message)
                addLog(deploymentId, 'info', `[${message.step}] ${message.message}`)
                break

            case 'completed':
                updateDeployment(deploymentId, {
                    status: 'success',
                    outputs: message.outputs,
                    duration: message.duration
                })
                addLog(deploymentId, 'success', `✓ Deployment completed in ${message.duration}`)
                // Close WebSocket after success
                const successWs = websockets.current.get(deploymentId)
                if (successWs) {
                    setTimeout(() => {
                        successWs.close()
                        websockets.current.delete(deploymentId)
                    }, 1000)
                }
                break

            case 'failed':
                updateDeployment(deploymentId, {
                    status: 'failed',
                    error: message.error,
                    duration: message.duration
                })
                addLog(deploymentId, 'error', `✗ Deployment failed: ${message.error}`)
                // Close WebSocket after failure
                const failedWs = websockets.current.get(deploymentId)
                if (failedWs) {
                    setTimeout(() => {
                        failedWs.close()
                        websockets.current.delete(deploymentId)
                    }, 1000)
                }
                break

            case 'error':
                addLog(deploymentId, 'error', message.message)
                break
        }
    }, [addLog, updateProgress, updateDeployment])

    const startDeployment = useCallback(async (config: any): Promise<string> => {
        try {
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

            const deploymentId = data.deploymentId

            // Initialize deployment state
            const initialState: DeploymentState = {
                deploymentId,
                status: 'connecting',
                logs: [{
                    level: 'info',
                    message: `Deployment ID: ${deploymentId}`,
                    timestamp: new Date().toLocaleTimeString()
                }],
                progress: [],
                outputs: null,
                error: null,
                duration: ''
            }

            setDeployments(prev => {
                const newMap = new Map(prev)
                newMap.set(deploymentId, initialState)
                return newMap
            })

            // Step 2: Connect to WebSocket
            const ws = new WebSocket(`${BACKEND_URL.replace('http', 'ws')}/ws/deploy/${deploymentId}`)
            websockets.current.set(deploymentId, ws)

            ws.onopen = () => {
                addLog(deploymentId, 'info', 'Connected to deployment service')
                updateDeployment(deploymentId, { status: 'deploying' })

                // Send start command
                ws.send(JSON.stringify({
                    type: 'start_deployment',
                    params: config
                }))
            }

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data)
                handleWebSocketMessage(deploymentId, message)
            }

            ws.onerror = () => {
                addLog(deploymentId, 'error', 'WebSocket error occurred')
                updateDeployment(deploymentId, {
                    status: 'failed',
                    error: 'WebSocket connection failed'
                })
            }

            ws.onclose = () => {
                addLog(deploymentId, 'info', 'WebSocket connection closed')
                websockets.current.delete(deploymentId)
            }

            return deploymentId

        } catch (err: any) {
            throw err
        }
    }, [addLog, updateDeployment, handleWebSocketMessage])

    const cancelDeployment = useCallback((deploymentId: string) => {
        const ws = websockets.current.get(deploymentId)
        if (ws) {
            ws.close()
            websockets.current.delete(deploymentId)
        }
        updateDeployment(deploymentId, { status: 'failed', error: 'Cancelled by user' })
        addLog(deploymentId, 'warn', 'Deployment cancelled by user')
    }, [updateDeployment, addLog])

    const getDeployment = useCallback((deploymentId: string) => {
        return deployments.get(deploymentId)
    }, [deployments])

    const clearDeployment = useCallback((deploymentId: string) => {
        setDeployments(prev => {
            const newMap = new Map(prev)
            newMap.delete(deploymentId)
            return newMap
        })
    }, [])

    // Get the most recent deployment as current
    const currentDeployment = Array.from(deployments.values()).sort((a, b) => {
        const aTime = a.logs[0]?.timestamp || ''
        const bTime = b.logs[0]?.timestamp || ''
        return bTime.localeCompare(aTime)
    })[0] || null

    return (
        <DeploymentManagerContext.Provider
            value= {{
        deployments,
            currentDeployment,
            startDeployment,
            cancelDeployment,
            getDeployment,
            clearDeployment
    }
}
        >
    { children }
    </DeploymentManagerContext.Provider>
    )
}

export function useDeploymentManager() {
    const context = useContext(DeploymentManagerContext)
    if (!context) {
        throw new Error('useDeploymentManager must be used within DeploymentManagerProvider')
    }
    return context
}