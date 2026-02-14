export namespace main {
	
	export class OpenFileResult {
	    path: string;
	    filename: string;
	    type: string;
	    content: string;
	
	    static createFrom(source: any = {}) {
	        return new OpenFileResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.filename = source["filename"];
	        this.type = source["type"];
	        this.content = source["content"];
	    }
	}
	export class ProcessResult {
	    ok: boolean;
	    message: string;
	    output?: string;
	    line?: number;
	    column?: number;
	
	    static createFrom(source: any = {}) {
	        return new ProcessResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ok = source["ok"];
	        this.message = source["message"];
	        this.output = source["output"];
	        this.line = source["line"];
	        this.column = source["column"];
	    }
	}

}

