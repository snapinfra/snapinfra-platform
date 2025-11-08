export interface Field {
    name: string;
    type: string;
    required?: boolean;
    unique?: boolean;
    references?: string;
}

export interface Table {
    name: string;
    fields: Field[];
}

export interface DatabaseConfig {
    type: string;
    host?: string;
    port?: number;
    name?: string;
}

export interface Project {
    name: string;
    description: string;
    schema: Table[];
    database?: DatabaseConfig;
}

export interface CodeGenOptions {
    framework: 'express' | 'fastify' | 'koa';
    language: 'javascript' | 'typescript';
    includeAuth: boolean;
    includeTests: boolean;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

export interface ModuleSpec {
    type: string;
    priority: number;
    dependencies: string[];
    tables?: string[];
    description: string;
    requiredFiles: string[];
    minFiles?: number;
    criticalFiles?: string[];
}

export interface GeneratedFile {
    path: string;
    content: string;
    description?: string;
    exports?: string[];
}

export interface FileContext {
    path: string;
    folder: string;
    filename: string;
    exports?: string[];
}

export interface GenerationContext {
    project: Project;
    options: CodeGenOptions;
    generatedFiles: Map<string, GeneratedFile>;
    fileRegistry: Map<string, FileContext>;
    moduleResults: Map<string, ModuleResult>;
    allDependencies: Record<string, string>;
    allDevDependencies: Record<string, string>;
    tableNames: string[];
    failedAttempts: Map<string, number>;
}

export interface ParsedResponse {
    files: GeneratedFile[];
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    success: boolean;
    error?: string;
}

export interface ModuleResult {
    type: string;
    files: GeneratedFile[];
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    success: boolean;
    validated: boolean;
    attempt: number;
    error?: string;
}

export interface CodeGenerationResult {
    files: GeneratedFile[];
    instructions: string;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    success: boolean;
    error?: string;
}

export type ProgressCallback = (
    moduleType: string,
    current: number,
    total: number
) => void;

// ============================================================================
// ENHANCED FUNCTION TRACKING FOR ACCURATE IMPORTS/EXPORTS
// ============================================================================

// Extended types
export interface FunctionInfo {
    name: string;
    type: 'function' | 'const' | 'factory';
    async: boolean;
    params?: string[];
    line?: number;
}

export interface EnhancedFileContext {
    path: string;
    module: string;
    filename: string;
    type: 'model' | 'service' | 'handler' | 'route' | 'util' | 'middleware' | 'config';
    exports: string[];
    functions: FunctionInfo[];
    imports: Array<{
        from: string;
        names: string[];
    }>;
}

export interface RegistryStats {
    totalFiles: number;
    totalFunctions: number;
    totalExports: number;
    factoryCount: number;
    handlerCount: number;
    byModule: Map<string, number>;
}


export class FunctionRegistry {
    private registry = new Map<string, EnhancedFileContext>();

    /**
     * Register a file with its functions
     * ENHANCED: Better error handling
     */
    register(filePath: string, content: string): EnhancedFileContext {
        try {
            const { exports, functions } = extractExportsWithFunctions(content, filePath);
            const imports = extractImports(content);

            // Normalize path separators for cross-platform compatibility
            const normalizedPath = filePath.replace(/\\/g, '/');
            const parts = normalizedPath.split('/');
            const filename = parts[parts.length - 1];
            const module = parts[parts.length - 2] || 'root';

            let type: EnhancedFileContext['type'] = 'util';
            if (normalizedPath.includes('/models/')) type = 'model';
            else if (normalizedPath.includes('/services/')) type = 'service';
            else if (normalizedPath.includes('/handlers/')) type = 'handler';
            else if (normalizedPath.includes('/routes/')) type = 'route';
            else if (normalizedPath.includes('/middleware/')) type = 'middleware';
            else if (normalizedPath.includes('/config/')) type = 'config';

            const context: EnhancedFileContext = {
                path: normalizedPath,
                module,
                filename,
                type,
                exports,
                functions,
                imports
            };

            this.registry.set(normalizedPath, context);
            return context;
        } catch (error) {
            console.warn(`⚠️  Error registering file ${filePath}:`, error);

            // Return minimal context on error
            const parts = filePath.split('/');
            return {
                path: filePath,
                module: parts[parts.length - 2] || 'root',
                filename: parts[parts.length - 1],
                type: 'util',
                exports: [],
                functions: [],
                imports: []
            };
        }
    }

    /**
     * Get file context
     */
    get(filePath: string): EnhancedFileContext | undefined {
        const normalizedPath = filePath.replace(/\\/g, '/');
        return this.registry.get(normalizedPath);
    }

    /**
     * Find function across all files
     */
    findFunction(functionName: string): Array<{ file: string; info: FunctionInfo }> {
        const results: Array<{ file: string; info: FunctionInfo }> = [];

        for (const [filePath, context] of this.registry) {
            const func = context.functions.find(f => f.name === functionName);
            if (func) {
                results.push({ file: filePath, info: func });
            }
        }

        return results;
    }

    /**
     * Validate imports for a file
     * ENHANCED: Better error messages
     */
    validateImports(filePath: string): Array<{ issue: string; import: string; from: string; suggestion?: string }> {
        const issues: Array<{ issue: string; import: string; from: string; suggestion?: string }> = [];
        const normalizedPath = filePath.replace(/\\/g, '/');
        const context = this.registry.get(normalizedPath);

        if (!context) return issues;

        for (const imp of context.imports) {
            // Skip node_modules imports
            if (!imp.from.startsWith('.') && !imp.from.startsWith('/')) {
                continue;
            }

            const importedFilePath = this.resolvePath(normalizedPath, imp.from);
            const importedContext = this.registry.get(importedFilePath);

            if (!importedContext) {
                issues.push({
                    issue: 'File not found',
                    import: imp.names.join(', '),
                    from: imp.from,
                    suggestion: `Check if ${importedFilePath} exists`
                });
                continue;
            }

            for (const name of imp.names) {
                if (!importedContext.exports.includes(name)) {
                    // Find similar names (typo detection)
                    const similar = importedContext.exports.find(exp =>
                        exp.toLowerCase() === name.toLowerCase() ||
                        exp.replace(/[A-Z]/g, m => m.toLowerCase()) === name.replace(/[A-Z]/g, m => m.toLowerCase())
                    );

                    issues.push({
                        issue: `Function '${name}' not exported`,
                        import: name,
                        from: imp.from,
                        suggestion: similar ? `Did you mean '${similar}'?` : `Available: ${importedContext.exports.join(', ')}`
                    });
                }
            }
        }

        return issues;
    }

    /**
     * Get import suggestions for a function
     */
    getSuggestedImports(functionName: string): Array<{ path: string; export: string }> {
        const suggestions: Array<{ path: string; export: string }> = [];

        for (const [filePath, context] of this.registry) {
            if (context.exports.includes(functionName)) {
                suggestions.push({
                    path: filePath,
                    export: functionName
                });
            }
        }

        return suggestions;
    }

    /**
     * Generate import suggestions as formatted strings
     */
    generateImportSuggestions(filePath: string): string[] {
        const suggestions: string[] = [];
        const normalizedPath = filePath.replace(/\\/g, '/');
        const context = this.registry.get(normalizedPath);

        if (!context) return suggestions;

        for (const imp of context.imports) {
            for (const name of imp.names) {
                const available = this.getSuggestedImports(name);
                if (available.length > 0) {
                    available.forEach(({ path }) => {
                        const relativePath = this.getRelativePath(normalizedPath, path);
                        suggestions.push(`   💡 Try: const { ${name} } = require('${relativePath}');`);
                    });
                }
            }
        }

        return suggestions;
    }

    /**
     * Generate import statement
     */
    generateImport(currentFile: string, targetFile: string, functionNames: string[]): string {
        const relativePath = this.getRelativePath(currentFile, targetFile);
        return `const { ${functionNames.join(', ')} } = require('${relativePath}');`;
    }

    /**
     * Get all functions by type
     */
    getFunctionsByType(type: FunctionInfo['type']): Map<string, FunctionInfo[]> {
        const result = new Map<string, FunctionInfo[]>();

        for (const [filePath, context] of this.registry) {
            const funcs = context.functions.filter(f => f.type === type);
            if (funcs.length > 0) {
                result.set(filePath, funcs);
            }
        }

        return result;
    }

    /**
     * Get registry statistics
     */
    getStats(): RegistryStats {
        let totalFunctions = 0;
        let totalExports = 0;
        let factoryCount = 0;
        let handlerCount = 0;
        const byModule = new Map<string, number>();

        for (const context of this.registry.values()) {
            totalFunctions += context.functions.length;
            totalExports += context.exports.length;

            factoryCount += context.functions.filter(f => f.type === 'factory').length;
            handlerCount += context.functions.filter(f => f.name.startsWith('handle')).length;

            const count = byModule.get(context.module) || 0;
            byModule.set(context.module, count + 1);
        }

        return {
            totalFiles: this.registry.size,
            totalFunctions,
            totalExports,
            factoryCount,
            handlerCount,
            byModule
        };
    }

    /**
     * Build context string for AI prompt
     */
    buildContextForAI(): string {
        let context = '\n📚 AVAILABLE FUNCTIONS REGISTRY:\n';
        context += '='.repeat(80) + '\n\n';

        const byModule = new Map<string, EnhancedFileContext[]>();
        for (const ctx of this.registry.values()) {
            const existing = byModule.get(ctx.module) || [];
            existing.push(ctx);
            byModule.set(ctx.module, existing);
        }

        for (const [module, contexts] of byModule) {
            context += `\n📁 ${module.toUpperCase()}/\n`;

            for (const ctx of contexts) {
                context += `\n  📄 ${ctx.filename}\n`;
                context += `     Path: ${ctx.path}\n`;

                if (ctx.exports.length > 0) {
                    context += `     Exports: ${ctx.exports.join(', ')}\n`;
                }

                if (ctx.functions.length > 0) {
                    context += `     Functions:\n`;
                    ctx.functions.forEach(func => {
                        const asyncStr = func.async ? 'async ' : '';
                        const paramsStr = func.params ? `(${func.params.join(', ')})` : '()';
                        context += `       - ${asyncStr}${func.name}${paramsStr}\n`;
                    });
                }

                if (ctx.imports.length > 0) {
                    context += `     Imports from:\n`;
                    ctx.imports.forEach(imp => {
                        context += `       - ${imp.from}: ${imp.names.join(', ')}\n`;
                    });
                }
            }
        }

        context += '\n' + '='.repeat(80) + '\n';
        return context;
    }

    /**
     * Build dependency context for specific modules
     */
    buildDependencyContext(dependencies: string[]): string {
        let context = '\n\n🔗 REQUIRED IMPORTS FOR THIS MODULE:\n';
        context += '='.repeat(80) + '\n';

        for (const dep of dependencies) {
            const depFiles = Array.from(this.registry.values())
                .filter(ctx => ctx.module === dep);

            if (depFiles.length > 0) {
                context += `\nFrom ${dep}:\n`;
                depFiles.forEach(file => {
                    if (file.exports.length > 0) {
                        context += `  • ${file.path}\n`;
                        context += `    Exports: ${file.exports.join(', ')}\n`;
                    }
                });
            }
        }

        context += '='.repeat(80) + '\n';
        return context;
    }

    /**
     * Helper: Resolve relative path
     * ENHANCED: Cross-platform compatibility
     */
    private resolvePath(from: string, to: string): string {
        if (!to.startsWith('.')) {
            return to;
        }

        const fromParts = from.replace(/\\/g, '/').split('/').slice(0, -1);
        const toParts = to.replace(/\\/g, '/').split('/');

        for (const part of toParts) {
            if (part === '.') continue;
            if (part === '..') {
                fromParts.pop();
            } else {
                fromParts.push(part);
            }
        }

        let resolved = fromParts.join('/');
        if (!resolved.endsWith('.js')) {
            resolved += '.js';
        }

        return resolved;
    }

    /**
     * Helper: Get relative path between files
     * ENHANCED: Cross-platform compatibility
     */
    private getRelativePath(from: string, to: string): string {
        const fromParts = from.replace(/\\/g, '/').split('/').slice(0, -1);
        const toParts = to.replace(/\\/g, '/').split('/');

        let common = 0;
        while (common < fromParts.length &&
            common < toParts.length &&
            fromParts[common] === toParts[common]) {
            common++;
        }

        const upLevels = fromParts.length - common;
        const relativeParts = Array(upLevels).fill('..');
        relativeParts.push(...toParts.slice(common));

        let path = relativeParts.join('/');
        if (!path.startsWith('.')) {
            path = './' + path;
        }

        return path.replace(/\.js$/, '');
    }
}

export function extractFunctions(content: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];

    try {
        const lines = content.split('\n');

        // Enhanced patterns to match various function declarations
        const patterns = [
            // function declarations: function myFunc() {} or async function myFunc() {}
            { regex: /(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g, type: 'function' as const },

            // const with arrow function: const myFunc = async () => {}
            { regex: /const\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/g, type: 'const' as const },

            // const with function: const myFunc = async function() {}
            { regex: /const\s+(\w+)\s*=\s*(?:async\s+)?function\s*\(([^)]*)\)/g, type: 'const' as const },

            // factory pattern: const createModel = () => { return {} }
            { regex: /const\s+(create\w+)\s*=\s*\(([^)]*)\)\s*=>\s*[{(]/g, type: 'factory' as const },
        ];

        lines.forEach((line, index) => {
            // Skip comments and empty lines
            if (line.trim().startsWith('//') || line.trim().startsWith('/*') || !line.trim()) {
                return;
            }

            patterns.forEach(({ regex, type }) => {
                regex.lastIndex = 0;

                let match;
                while ((match = regex.exec(line)) !== null) {
                    const name = match[1];
                    const paramsStr = match[2] || '';

                    // Skip if already found or if name is invalid
                    if (!name || functions.find(f => f.name === name)) {
                        continue;
                    }

                    // Parse parameters
                    const params = paramsStr
                        .split(',')
                        .map(p => p.trim())
                        .filter(Boolean)
                        .map(p => {
                            // Handle destructuring: { x, y } or { x: newX }
                            if (p.startsWith('{')) {
                                return p;
                            }
                            // Handle default params: x = 10
                            const paramName = p.split('=')[0].trim();
                            return paramName;
                        });

                    // Detect if async
                    const isAsync = line.includes('async');

                    // Determine function type more accurately
                    let funcType: FunctionInfo['type'] = type;
                    if (name.startsWith('create')) {
                        funcType = 'factory';
                    } else if (line.includes('function')) {
                        funcType = 'function';
                    }

                    functions.push({
                        name,
                        type: funcType,
                        async: isAsync,
                        params: params.length > 0 ? params : undefined,
                        line: index + 1
                    });
                }
            });
        });

        return functions;
    } catch (error) {
        console.warn('⚠️  Error extracting functions:', error);
        return [];
    }
}

/**
 * Enhanced export extraction with function details
 * ENHANCED: Better parsing for complex export patterns
 */
export function extractExportsWithFunctions(
    content: string,
    filePath: string
): { exports: string[]; functions: FunctionInfo[] } {
    const exports: string[] = [];
    const functions = extractFunctions(content);

    try {
        // Pattern 1: module.exports = { ... }
        const namedExportsMatch = content.match(/module\.exports\s*=\s*\{([^}]+)\}/s);
        if (namedExportsMatch) {
            const exportsContent = namedExportsMatch[1];

            // Split by comma, handling nested objects
            let depth = 0;
            let current = '';

            for (let i = 0; i < exportsContent.length; i++) {
                const char = exportsContent[i];

                if (char === '{' || char === '[') depth++;
                if (char === '}' || char === ']') depth--;

                if (char === ',' && depth === 0) {
                    const exportName = current.trim();
                    if (exportName && !exportName.startsWith('//')) {
                        // Handle shorthand and key: value
                        const colonIndex = exportName.indexOf(':');
                        const name = colonIndex > 0
                            ? exportName.substring(0, colonIndex).trim()
                            : exportName;

                        if (name && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
                            exports.push(name);
                        }
                    }
                    current = '';
                } else {
                    current += char;
                }
            }

            // Don't forget the last one
            if (current.trim()) {
                const exportName = current.trim();
                if (exportName && !exportName.startsWith('//')) {
                    const colonIndex = exportName.indexOf(':');
                    const name = colonIndex > 0
                        ? exportName.substring(0, colonIndex).trim()
                        : exportName;

                    if (name && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
                        exports.push(name);
                    }
                }
            }
        }

        // Pattern 2: module.exports.functionName = ...
        const individualExportsRegex = /module\.exports\.(\w+)\s*=/g;
        let match;
        while ((match = individualExportsRegex.exec(content)) !== null) {
            const name = match[1];
            if (name && !exports.includes(name)) {
                exports.push(name);
            }
        }

        // Pattern 3: exports.functionName = ...
        const exportsPropertyRegex = /exports\.(\w+)\s*=/g;
        while ((match = exportsPropertyRegex.exec(content)) !== null) {
            const name = match[1];
            if (name && !exports.includes(name)) {
                exports.push(name);
            }
        }

        return { exports: [...new Set(exports)], functions };
    } catch (error) {
        console.warn(`⚠️  Error extracting exports from ${filePath}:`, error);
        return { exports: [], functions };
    }
}

export function extractImports(content: string): Array<{ from: string; names: string[] }> {
    const imports: Array<{ from: string; names: string[] }> = [];

    try {
        // Pattern 1: const { x, y } = require('...')
        const destructuredPattern = /const\s+\{\s*([^}]+)\s*\}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

        let match;
        while ((match = destructuredPattern.exec(content)) !== null) {
            const namesStr = match[1];
            const from = match[2];

            // Parse names, handling aliases: { x: newX, y }
            const names = namesStr
                .split(',')
                .map(n => {
                    const trimmed = n.trim();
                    // Handle aliasing
                    const colonIndex = trimmed.indexOf(':');
                    if (colonIndex > 0) {
                        return trimmed.substring(0, colonIndex).trim();
                    }
                    return trimmed;
                })
                .filter(Boolean);

            if (names.length > 0) {
                imports.push({ from, names });
            }
        }

        // Pattern 2: const moduleName = require('...')
        const directPattern = /const\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        while ((match = directPattern.exec(content)) !== null) {
            const name = match[1];
            const from = match[2];

            // Only add if not already captured by destructured pattern
            if (!imports.some(imp => imp.from === from)) {
                imports.push({ from, names: [name] });
            }
        }

        return imports;
    } catch (error) {
        console.warn('⚠️  Error extracting imports:', error);
        return [];
    }
}

export const toCamelCase = (str) => {
    return str
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
};

export const toPascalCase = (str) => {
    const camel = toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
};

/**
 * Clean JSON response from AI with improved escape sequence handling
 * FIXED: Preserves necessary escape sequences while removing markdown
 */
export function cleanJSONResponse(text: string): string {
    let clean = text.trim();

    // Step 1: Remove markdown code blocks (preserving content)
    clean = clean.replace(/^```(?:json|javascript|js)?\s*\n?/gim, '');
    clean = clean.replace(/\n?```\s*$/gm, '');

    // Step 2: Remove any preamble text before JSON starts
    const jsonStart = clean.indexOf('{');
    if (jsonStart > 0) {
        clean = clean.substring(jsonStart);
    }

    // Step 3: Remove any trailing text after JSON ends
    const lastBrace = clean.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < clean.length - 1) {
        clean = clean.substring(0, lastBrace + 1);
    }

    // Step 4: Fix common AI mistakes while preserving valid escapes
    // Replace escaped backslashes ONLY in specific contexts
    clean = clean.replace(/\\\\\\/g, '\\'); // Triple backslash to single
    
    // Fix double-escaped newlines that AI sometimes generates
    clean = clean.replace(/\\\\n/g, '\\n');
    clean = clean.replace(/\\\\t/g, '\\t');
    clean = clean.replace(/\\\\r/g, '\\r');

    return clean;
}

/**
 * Advanced JSON repair with better error handling
 * FIXED: Handles nested structures and preserves content integrity
 */
export function repairJSON(json: string): string {
    let repaired = json.trim();

    try {
        // Step 1: Balance braces and brackets
        const openBraces = (repaired.match(/\{/g) || []).length;
        const closeBraces = (repaired.match(/\}/g) || []).length;
        const openBrackets = (repaired.match(/\[/g) || []).length;
        const closeBrackets = (repaired.match(/\]/g) || []).length;

        if (openBraces > closeBraces) {
            console.log(`   🔧 Adding ${openBraces - closeBraces} closing braces`);
            repaired += '}'.repeat(openBraces - closeBraces);
        }

        if (openBrackets > closeBrackets) {
            console.log(`   🔧 Adding ${openBrackets - closeBrackets} closing brackets`);
            repaired += ']'.repeat(openBrackets - closeBrackets);
        }

        // Step 2: Fix trailing commas (common AI mistake)
        repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

        // Step 3: Fix missing commas between array elements or object properties
        // Look for patterns like: }"text" or ]"text" or }{ or ][
        repaired = repaired.replace(/}(\s*)"/g, '},$1"');
        repaired.replace(/](\s*)"/g, '],$1"');
        repaired = repaired.replace(/}(\s*)\{/g, '},$1{');
        repaired = repaired.replace(/](\s*)\[/g, '],$1[');

        // Step 4: Fix unescaped newlines in strings (major issue)
        repaired = repaired.replace(/("(?:[^"\\]|\\.)*?")/g, (match) => {
            // Only fix unescaped newlines, preserve \\n
            return match.replace(/(?<!\\)\n/g, '\\n')
                       .replace(/(?<!\\)\r/g, '\\r')
                       .replace(/(?<!\\)\t/g, '\\t');
        });

        // Step 5: Fix common quote escaping issues
        // Handle cases where quotes inside strings aren't properly escaped
        repaired = repaired.replace(/"([^"]*)"(\s*:\s*)"([^"]*)(?<!\\)"([^"]*?)"/g, 
            '"$1": "$3\\"$4"');

        return repaired;
    } catch (error) {
        console.warn('⚠️  JSON repair encountered an error:', error);
        return json; // Return original if repair fails
    }
}

/**
 * Validate and parse JSON with comprehensive error recovery
 * FIXED: Multi-stage parsing with detailed error reporting
 */
export function parseJSONWithRecovery(text: string): ParsedResponse {
    const errors: string[] = [];

    // Stage 1: Try parsing as-is
    try {
        const parsed = JSON.parse(text);
        console.log('   ✅ JSON parsed successfully (no cleaning needed)');
        return validateParsedResponse(parsed);
    } catch (error: any) {
        errors.push(`Stage 1 failed: ${error.message}`);
    }

    // Stage 2: Try with basic cleaning
    try {
        const cleaned = cleanJSONResponse(text);
        const parsed = JSON.parse(cleaned);
        console.log('   ✅ JSON parsed after cleaning');
        return validateParsedResponse(parsed);
    } catch (error: any) {
        errors.push(`Stage 2 failed: ${error.message}`);
    }

    // Stage 3: Try with repair
    try {
        const cleaned = cleanJSONResponse(text);
        const repaired = repairJSON(cleaned);
        const parsed = JSON.parse(repaired);
        console.log('   ✅ JSON parsed after repair');
        return validateParsedResponse(parsed);
    } catch (error: any) {
        errors.push(`Stage 3 failed: ${error.message}`);
    }

    // Stage 4: Try aggressive repair
    try {
        console.log('   🔧 Attempting aggressive JSON repair...');
        const aggressiveRepair = aggressiveJSONRepair(text);
        const parsed = JSON.parse(aggressiveRepair);
        console.log('   ✅ JSON parsed after aggressive repair');
        return validateParsedResponse(parsed);
    } catch (error: any) {
        errors.push(`Stage 4 failed: ${error.message}`);
    }

    // Stage 5: Try to extract valid JSON from partial response
    try {
        console.log('   🔧 Attempting to extract partial valid JSON...');
        const extracted = extractPartialJSON(text);
        if (extracted) {
            const parsed = JSON.parse(extracted);
            console.log('   ⚠️  Partial JSON extracted and parsed');
            return validateParsedResponse(parsed);
        }
    } catch (error: any) {
        errors.push(`Stage 5 failed: ${error.message}`);
    }

    // All stages failed - provide detailed error report
    console.error('❌ All JSON parsing stages failed:');
    errors.forEach((err, i) => console.error(`   ${i + 1}. ${err}`));
    
    // Show first 500 chars of problematic JSON
    console.error('\n📄 Response preview (first 500 chars):');
    console.error(text.substring(0, 500));
    console.error('\n📄 Response end (last 500 chars):');
    console.error(text.substring(Math.max(0, text.length - 500)));

    throw new Error(`Failed to parse JSON after all recovery attempts. Last error: ${errors[errors.length - 1]}`);
}

/**
 * Aggressive JSON repair for severely malformed responses
 */
function aggressiveJSONRepair(json: string): string {
    let repaired = cleanJSONResponse(json);

    // Fix common content issues that break JSON
    // 1. Replace literal newlines in content with \n
    repaired = repaired.replace(/"content"\s*:\s*"([^"]*)"/gs, (match, content) => {
        const fixed = content
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')
            .replace(/\\/g, '\\\\')  // Escape backslashes
            .replace(/"/g, '\\"');   // Escape quotes
        return `"content": "${fixed}"`;
    });

    // 2. Fix description field similarly
    repaired = repaired.replace(/"description"\s*:\s*"([^"]*)"/gs, (match, content) => {
        const fixed = content
            .replace(/\n/g, ' ')  // Replace newlines with spaces in descriptions
            .replace(/\r/g, '')
            .replace(/\t/g, ' ')
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"');
        return `"description": "${fixed}"`;
    });

    // 3. Balance all brackets and braces
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;

    if (openBraces > closeBraces) {
        repaired += '}'.repeat(openBraces - closeBraces);
    }
    if (openBrackets > closeBrackets) {
        repaired += ']'.repeat(openBrackets - closeBrackets);
    }

    // 4. Remove trailing commas
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

    // 5. Ensure success field exists
    if (!repaired.includes('"success"')) {
        repaired = repaired.replace(/}$/, ', "success": true}');
    }

    return repaired;
}

/**
 * Extract partial valid JSON from truncated response
 */
function extractPartialJSON(text: string): string | null {
    const cleaned = cleanJSONResponse(text);
    
    // Find the files array
    const filesMatch = cleaned.match(/"files"\s*:\s*\[/);
    if (!filesMatch) return null;

    let depth = 0;
    let inString = false;
    let escape = false;
    let filesStart = filesMatch.index! + filesMatch[0].length - 1;
    let filesEnd = -1;

    // Find the end of the files array
    for (let i = filesStart; i < cleaned.length; i++) {
        const char = cleaned[i];

        if (escape) {
            escape = false;
            continue;
        }

        if (char === '\\') {
            escape = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (!inString) {
            if (char === '[') depth++;
            if (char === ']') {
                depth--;
                if (depth === 0) {
                    filesEnd = i;
                    break;
                }
            }
        }
    }

    if (filesEnd === -1) return null;

    // Construct minimal valid JSON with found files
    const filesArray = cleaned.substring(filesStart, filesEnd + 1);
    return `{
        "files": ${filesArray},
        "dependencies": {},
        "devDependencies": {},
        "success": true
    }`;
}

/**
 * Validate parsed response structure
 */
function validateParsedResponse(parsed: any): ParsedResponse {
    if (!parsed || typeof parsed !== 'object') {
        throw new Error('Parsed result is not an object');
    }

    // Ensure required fields exist
    const response: ParsedResponse = {
        files: Array.isArray(parsed.files) ? parsed.files : [],
        dependencies: parsed.dependencies || {},
        devDependencies: parsed.devDependencies || {},
        success: parsed.success !== false
    };

    // Validate files structure
    response.files = response.files.filter((file: any) => {
        if (!file.path || !file.content) {
            console.warn(`   ⚠️  Skipping invalid file entry: ${JSON.stringify(file).substring(0, 100)}`);
            return false;
        }
        return true;
    });

    // Validate dependencies
    if (typeof response.dependencies !== 'object') {
        console.warn('   ⚠️  Invalid dependencies, using empty object');
        response.dependencies = {};
    }

    if (typeof response.devDependencies !== 'object') {
        console.warn('   ⚠️  Invalid devDependencies, using empty object');
        response.devDependencies = {};
    }

    if (response.files.length === 0) {
        throw new Error('No valid files in parsed response');
    }

    return response;
}

export function parseFilePath(path: string): FileContext {
    const normalizedPath = path.replace(/\\/g, '/');
    const parts = normalizedPath.split('/');
    const filename = parts[parts.length - 1];
    const folder = parts.slice(0, -1).join('/');

    return {
        path: normalizedPath,
        folder,
        filename,
        exports: []
    };
}


// ============================================================================
// RETRY UTILITY (ENHANCED WITH EXPONENTIAL BACKOFF)
// ============================================================================

export async function generateWithRetry(
    generateFn: () => Promise<any>,
    maxRetries = 4,
    baseDelay = 5000
): Promise<any> {
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await generateFn();
        } catch (error: any) {
            lastError = error;

            // Check for rate limit errors
            if (error.message?.includes('Rate limit') ||
                error.message?.includes('429') ||
                error.message?.includes('quota')) {
                const waitTime = baseDelay * Math.pow(2, attempt);
                console.log(`   ⏳ Rate limited. Waiting ${(waitTime / 1000).toFixed(1)}s...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            // Check for temporary errors
            if (error.message?.includes('timeout') ||
                error.message?.includes('ECONNRESET') ||
                error.message?.includes('ETIMEDOUT')) {
                if (attempt < maxRetries - 1) {
                    const waitTime = baseDelay * (attempt + 1);
                    console.log(`   🔄 Connection issue. Retry ${attempt + 1}/${maxRetries} in ${(waitTime / 1000).toFixed(1)}s...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
            }

            // For other errors, retry with delay
            if (attempt < maxRetries - 1) {
                const waitTime = baseDelay * (attempt + 1);
                console.log(`   🔄 Retry ${attempt + 1}/${maxRetries} in ${(waitTime / 1000).toFixed(1)}s...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    throw lastError || new Error('Max retries exceeded');
}
export const LANGUAGE = 'javascript';
