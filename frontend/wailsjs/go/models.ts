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

}

