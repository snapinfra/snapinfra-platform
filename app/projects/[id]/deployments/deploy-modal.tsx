// components/deploy-modal.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Rocket, Loader2, CheckCircle, XCircle, AlertCircle, Terminal } from "lucide-react"

interface DeployModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectId: string
    projectName: string
}

interface DeploymentLog {
    message: string
    type: 'info' | 'success' | 'error'
    timestamp: string
}

export function DeployModal({ open, onOpenChange, projectId, projectName }: DeployModalProps) {
    const [credentials, setCredentials] = useState({
        accessKeyId: '',
        secretAccessKey: '',
        region: 'us-east-1'
    })
    const [deploying, setDeploying] = useState(false)
    const [fetchingData, setFetchingData] = useState(false)
    const [logs, setLogs] = useState<DeploymentLog[]>([])
    const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [progress, setProgress] = useState(0)

    const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
        setLogs(prev => [...prev, { message, type, timestamp: new Date().toISOString() }])
    }

    const fetchProjectData = async () => {
        try {
            setFetchingData(true)
            addLog('🔍 Fetching project data from DynamoDB...', 'info')

            // Get user ID from your auth context or session
            // Adjust this based on your auth setup
            const userId = localStorage.getItem('userId') || 'user_35D1LiK0985qSJCacutmHh73oxA'

            // Fetch project from DynamoDB
            const response = await fetch(`/api/project/${projectId}`, {
                headers: {
                    'x-user-id': userId
                }
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to fetch project data')
            }

            const projectData = await response.json()

            addLog('✅ Project data fetched successfully', 'success')

            console.log('=== PROJECT DATA FROM DYNAMODB ===')
            console.log(projectData)
            console.log('==================================')

            // Log specific parts for clarity
            console.log('📋 Project Info:', {
                id: projectData.id,
                name: projectData.name,
                userId: projectData.userId,
                status: projectData.status
            })

            if (projectData.data?.schema) {
                console.log('📊 Schema:', projectData.data.schema)
            }

            if (projectData.s3Assets) {
                addLog('📦 S3 assets available', 'success')
                console.log('📦 S3 Assets:', projectData.s3Assets)
            }

            return projectData
        } catch (error) {
            console.error('Error fetching project data:', error)
            addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
            throw error
        } finally {
            setFetchingData(false)
        }
    }

    const handleDeploy = async () => {
        if (!credentials.accessKeyId || !credentials.secretAccessKey) {
            addLog('❌ Please fill in all AWS credentials', 'error')
            return
        }

        setDeploying(true)
        setDeploymentStatus('idle')
        setLogs([])
        setProgress(0)

        try {
            // Step 1: Fetch project data from DynamoDB + S3
            addLog('📊 Step 1/5: Fetching project data...', 'info')
            setProgress(10)
            const projectData = await fetchProjectData()
            setProgress(20)

            // Step 2: Prepare deployment package
            addLog('📦 Step 2/5: Preparing deployment package...', 'info')
            setProgress(40)
            await new Promise(resolve => setTimeout(resolve, 1500))

            // Step 3: Start deployment to AWS
            addLog('🚀 Step 3/5: Initiating deployment to AWS...', 'info')
            setProgress(60)

            const deployResponse = await fetch('http://localhost:3001/api/deploy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    credentials,
                    projectData // Send the fetched project data
                })
            })

            if (!deployResponse.ok) {
                throw new Error('Deployment failed')
            }

            const reader = deployResponse.body?.getReader()
            const decoder = new TextDecoder()

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const chunk = decoder.decode(value)
                    const lines = chunk.split('\n')

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6))
                                addLog(data.message, data.type)

                                if (data.type === 'success') {
                                    setProgress(100)
                                    setDeploymentStatus('success')
                                } else if (data.type === 'error') {
                                    setDeploymentStatus('error')
                                }
                            } catch (e) {
                                console.error('Failed to parse log:', e)
                            }
                        }
                    }
                }
            }

            if (deploymentStatus !== 'error') {
                addLog('✅ Deployment completed successfully!', 'success')
                setDeploymentStatus('success')
            }

        } catch (error) {
            console.error('Deployment error:', error)
            addLog(`❌ Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
            setDeploymentStatus('error')
        } finally {
            setDeploying(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Rocket className="w-5 h-5" />
                        Deploy {projectName}
                    </DialogTitle>
                    <DialogDescription>
                        Enter your AWS credentials to deploy this project
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* AWS Credentials Form */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="accessKeyId">AWS Access Key ID</Label>
                            <Input
                                id="accessKeyId"
                                type="text"
                                value={credentials.accessKeyId}
                                onChange={(e) => setCredentials({ ...credentials, accessKeyId: e.target.value })}
                                placeholder="AKIAIOSFODNN7EXAMPLE"
                                disabled={deploying || fetchingData}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="secretAccessKey">AWS Secret Access Key</Label>
                            <Input
                                id="secretAccessKey"
                                type="password"
                                value={credentials.secretAccessKey}
                                onChange={(e) => setCredentials({ ...credentials, secretAccessKey: e.target.value })}
                                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCY..."
                                disabled={deploying || fetchingData}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="region">AWS Region</Label>
                            <Select
                                value={credentials.region}
                                onValueChange={(value) => setCredentials({ ...credentials, region: value })}
                                disabled={deploying || fetchingData}
                            >
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
                                    <SelectItem value="ap-south-1">Asia Pacific (Mumbai)</SelectItem>
                                    <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                                    <SelectItem value="ap-northeast-1">Asia Pacific (Tokyo)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Your credentials are transmitted securely and used only for this deployment.
                            </AlertDescription>
                        </Alert>
                    </div>

                    {/* Progress Bar */}
                    {(deploying || fetchingData) && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">
                                    {fetchingData ? 'Fetching project data...' : 'Deploying...'}
                                </span>
                                <span className="text-gray-500">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    )}

                    {/* Deployment Logs */}
                    {logs.length > 0 && (
                        <div className="bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto">
                            <div className="flex items-center mb-3">
                                <Terminal className="text-green-400 mr-2" size={18} />
                                <h3 className="text-white font-semibold text-sm">Deployment Logs</h3>
                            </div>
                            <div className="space-y-2 font-mono text-xs">
                                {logs.map((log, idx) => (
                                    <div key={idx} className="flex items-start">
                                        {log.type === 'success' && <CheckCircle className="text-green-400 mr-2 flex-shrink-0 mt-0.5" size={14} />}
                                        {log.type === 'error' && <XCircle className="text-red-400 mr-2 flex-shrink-0 mt-0.5" size={14} />}
                                        {log.type === 'info' && <div className="w-1 h-1 bg-blue-400 rounded-full mr-2 flex-shrink-0 mt-1.5"></div>}
                                        <span className={`${log.type === 'success' ? 'text-green-300' :
                                            log.type === 'error' ? 'text-red-300' :
                                                'text-gray-300'
                                            }`}>{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Status Messages */}
                    {deploymentStatus === 'success' && (
                        <Alert className="border-green-500 bg-green-50">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                Deployment completed successfully! Your application is now live.
                            </AlertDescription>
                        </Alert>
                    )}

                    {deploymentStatus === 'error' && (
                        <Alert className="border-red-500 bg-red-50">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                                Deployment failed. Please check the logs above for details.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={deploying || fetchingData}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeploy}
                            disabled={deploying || fetchingData || !credentials.accessKeyId || !credentials.secretAccessKey}
                            className="gap-2"
                        >
                            {(deploying || fetchingData) ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {fetchingData ? 'Fetching Data...' : 'Deploying...'}
                                </>
                            ) : (
                                <>
                                    <Rocket className="w-4 h-4" />
                                    Deploy to AWS
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}


// ============================================
// UPDATE YOUR DEPLOYMENT PAGE
// File: app/projects/[id]/deployments/page.tsx
// ============================================

// Add this import at the top:
// import { DeployModal } from "@/components/deploy-modal"

// Add state for the modal:
// const [showDeployModal, setShowDeployModal] = useState(false)

// Replace the "Deploy Now" button with:
/*
<Button
  className="gap-2"
  onClick={() => setShowDeployModal(true)}
>
  <Rocket className="w-4 h-4" />
  Deploy Now
</Button>
*/

// Add the modal at the end of your component (before the closing </EnterpriseDashboardLayout>):
/*
<DeployModal
  open={showDeployModal}
  onOpenChange={setShowDeployModal}
  projectId={projectId}
  projectName={state.currentProject?.name || 'Project'}
/>
*/