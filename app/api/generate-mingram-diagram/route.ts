import { NextRequest, NextResponse } from 'next/server';

const FLASK_SERVICE_URL = process.env.FLASK_SERVICE_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
    try {
        const { prompt } = await request.json();
        console.log('reached here')

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        console.log('reached here')

        // Call Flask service to generate diagram
        const response = await fetch(`${FLASK_SERVICE_URL}/execute-and-generate`, {  // ← Fixed: parentheses instead of backticks
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({
                error: data.error || 'Failed to generate diagram',
                code: data.code || null,
                image: null
            }, { status: response.status });
        }

        return NextResponse.json({
            code: data.code,
            image: data.image
        });

    } catch (error) {
        console.error('Error communicating with Flask service:', error);
        return NextResponse.json(
            {
                error: 'Failed to connect to diagram generation service',
                code: null,
                image: null
            },
            { status: 500 }
        );
    }
}