class SuccessResponse{
    success: boolean = true;
    code: number = 200;
    message: string = "Process Successful";
    data: Record<string,any> = {};

    constructor(code: number = 200, message: string = "Process successful", data: Record<string, any> = {}){
        this.success = true;
        this.code = code;
        this.message = message;
        this.data = data;
    }
}

export default SuccessResponse;