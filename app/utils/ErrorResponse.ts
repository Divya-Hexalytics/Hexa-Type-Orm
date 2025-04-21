class ErrorResponse extends Error{
    success: boolean;
    code: number;
    message: string;
    errors: string | Record<string,any> | null;
    stack: string | undefined;

    constructor(code: number = 500, message: string = "Something went wrong", errors:string | Record<string,any>| null = null, stack: string | undefined = undefined){
        super(message);
        this.success = false,
        this.code = code;
        this.message = message;
        this.errors = errors;
        if(stack){
            this.stack = stack;
        }
    };

}

export default ErrorResponse