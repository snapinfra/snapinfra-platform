// ============================================
// FILE: lib/appContext/s3-storage-manager.ts
// NEW FILE - Create this
// ============================================

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const MAX_DYNAMODB_SIZE = 350 * 1024 // 350 KB safe limit (DynamoDB max is 400 KB)

export class S3StorageManager {
    private client: S3Client | null = null
    private bucket: string
    private userId: string
    private enabled = false

    constructor(userId: string) {
        this.userId = userId
        this.bucket = process.env.NEXT_PUBLIC_S3_BUCKET || 'snapinfra-storage'

        // Only initialize S3 if credentials are available
        if (this.hasValidCredentials()) {
            try {
                this.client = new S3Client({
                    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
                    credentials: {
                        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
                        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
                    },
                })
                this.enabled = true
                console.log('✅ S3 storage enabled')
            } catch (error) {
                console.warn('⚠️ S3 initialization failed:', error)
                this.enabled = false
            }
        } else {
            console.log('ℹ️ S3 credentials not configured, large files will not be stored')
            this.enabled = false
        }
    }

    private hasValidCredentials(): boolean {
        return !!(
            process.env.NEXT_PUBLIC_AWS_REGION &&
            process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID &&
            process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY &&
            process.env.NEXT_PUBLIC_S3_BUCKET
        )
    }

    /**
     * Check if data should be stored in S3 based on size
     */
    shouldUseS3(data: any): boolean {
        const size = this.getDataSize(data)
        return size > MAX_DYNAMODB_SIZE
    }

    /**
     * Calculate size of data in bytes
     */
    getDataSize(data: any): number {
        return new Blob([JSON.stringify(data)]).size
    }

    /**
     * Generate S3 key for data
     */
    private generateS3Key(key: string): string {
        // Format: users/{userId}/{type}/{id}/{timestamp}
        const timestamp = Date.now()
        const [type, id] = key.split(':')
        return `users/${this.userId}/${type}/${id || 'data'}/${timestamp}.json`
    }

    /**
     * Save data to S3
     */
    async saveToS3(key: string, data: any): Promise<{
        success: boolean
        s3Key?: string
        size?: number
        error?: any
    }> {
        if (!this.enabled || !this.client) {
            return { success: false, error: 'S3 not enabled' }
        }

        try {
            const jsonData = JSON.stringify(data)
            const size = new Blob([jsonData]).size
            const s3Key = this.generateS3Key(key)

            await this.client.send(
                new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: s3Key,
                    Body: jsonData,
                    ContentType: 'application/json',
                    Metadata: {
                        userId: this.userId,
                        originalKey: key,
                        size: size.toString(),
                        timestamp: Date.now().toString(),
                    },
                })
            )

            console.log(`✅ Saved ${(size / 1024).toFixed(2)} KB to S3: ${s3Key}`)
            return { success: true, s3Key, size }
        } catch (error) {
            console.error('❌ Failed to save to S3:', error)
            return { success: false, error }
        }
    }

    /**
     * Load data from S3
     */
    async loadFromS3<T>(s3Key: string): Promise<T | null> {
        if (!this.enabled || !this.client) {
            return null
        }

        try {
            const response = await this.client.send(
                new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: s3Key,
                })
            )

            const bodyString = await response.Body?.transformToString()
            if (!bodyString) return null

            const data = JSON.parse(bodyString)
            console.log(`✅ Loaded data from S3: ${s3Key}`)
            return data as T
        } catch (error) {
            console.error('❌ Failed to load from S3:', error)
            return null
        }
    }

    /**
     * Delete data from S3
     */
    async deleteFromS3(s3Key: string): Promise<{ success: boolean }> {
        if (!this.enabled || !this.client) {
            return { success: false }
        }

        try {
            await this.client.send(
                new DeleteObjectCommand({
                    Bucket: this.bucket,
                    Key: s3Key,
                })
            )

            console.log(`✅ Deleted from S3: ${s3Key}`)
            return { success: true }
        } catch (error) {
            console.error('❌ Failed to delete from S3:', error)
            return { success: false }
        }
    }

    isEnabled(): boolean {
        return this.enabled
    }
}