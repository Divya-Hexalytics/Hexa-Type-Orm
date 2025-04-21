interface ApiError {
    message?: string;
    // Add other properties if needed (e.g., code, details)
  }
type RequestBody = Record<string, any>
type RequestKeyType = Record<string, string>;
type RequestKeyName = Record<string, string>;

import { version } from 'os';
import validator from 'validator';

class Util {
    
    static getSuccessResponse(data: Array<string>, message: string = '') {
      return {
        success: true,
        code: 200,
        message: message,
        data: data,
      };
    }
  
    static getErrorResponse(error: ApiError[], message: string = '', code: number = 500) {
      if (typeof error === "object") {
        return {
          success: false,
          code: 422,
          message: message,
          error: error,
        };
      } else {
        return {
          success: false,
          code: code,
          message: message,
          error: error,
        };
      }
    }
  
    static getApiErrorResponse(error: ApiError[], message: string = '') {
        let errorMessage: string  = message;

        if (error && error.length > 0 && error[0].message) {
            errorMessage = error[0].message;
        }

      return {
        success: false,
        code: 500,
        message: error[0].message,
        error: error,
      };
    }
  
    static getUnauthorizedResponse(error: ApiError[], message: string = '') {
      return {
        success: false,
        code: 401,
        message: message,
        error: error,
      };
    }
  
    // Validates required params of requests
    static validate_prams(InputArr: RequestBody, KeyArr: RequestKeyType, NameArr: RequestKeyName): Record<string, string> {
        // let key: null | string  = null
        let errors: Record<string, string> = {};
        for (const key in KeyArr) {
          try {
            if (InputArr[key] !== undefined && typeof InputArr[key] === "string") {
              InputArr[key] = InputArr[key].trim();
            }
            
                if (InputArr[key] === undefined || InputArr[key] === null || InputArr[key] === "") {
                errors[key] = `${NameArr[key] || key} is missing.`;
                } else if (typeof KeyArr[key] === "object") {
                const nestedErrors = this.validate_prams(
                    (InputArr[key] || {}) as RequestBody, // Type assertion for nested object
                    KeyArr[key] as RequestKeyType, // Type assertion for nested object
                    (NameArr[key] || {}) as RequestKeyName // Type assertion for nested object
                );
                errors = { ...errors, ...nestedErrors };
                } else if (!this.regValidate(KeyArr[key] as string, InputArr[key])) { // Type assertion for regValidate
                errors[key] = `${NameArr[key] || key} is in the wrong format.`;
                }
            } catch (err: any) { // Type assertion for err
                errors[key] = err.message;
            }
            
        }
        return errors;
    }
  
    // Validates optional params of requests
    static validate_optional_prams(InputArr: RequestBody, KeyArr:RequestKeyType, NameArr: RequestKeyName) {
        // let key: null | string  = null

      let errors: Record<string, string> = {};
      for (const key in KeyArr) {
        try {
          if (InputArr[key] !== undefined && typeof InputArr[key] === "string") {
            InputArr[key] = InputArr[key].trim();
          }
          if (typeof KeyArr[key] === "object") {
            const nestedErrors = this.validate_optional_prams(
              (InputArr[key] || {}) as RequestBody,
              KeyArr[key] as RequestKeyType,
              (NameArr[key] || {}) as RequestKeyName
            );
            errors = { ...errors, ...nestedErrors };
          } else if (
            InputArr[key] !== undefined &&
            InputArr[key] !== null &&
            InputArr[key] !== "" &&
            (typeof InputArr[key] === "object" ||
              !this.regValidate(KeyArr[key] as string, InputArr[key]))
          ) {
            errors[key] = `${NameArr[key] || key} is in the wrong format`;
            
          } 
          else if ( 
            InputArr[key] === undefined || 
            (InputArr[key] == null && InputArr[key] == "") 
          )
          {
            InputArr[key] =
              ["D", "DT", "T"].indexOf(key) !== -1
                ? null
                : ["N", "F", "PIN"].indexOf(key) !== -1
                ? 0
                : "";
          }
        } catch (err: any) {
          errors[key] = err.message;
        }
      }
  
      return errors;
    }
  
    // Regex validation
    static regValidate(type: string, val: any) {
      switch (type) {
        case "D":
          return validator.isDate(val,{format:'YYYY-MM-DD'})
          // return /^\d{4}-\d{2}-\d{2}$/.test(val); //date Y-m-d
        case "DT":
          return validator.isDate(val,{format:'YYYY-MM-DD HH:ii:ss'})
          // return /^\d{4}-\d{2}-\d{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$/.test(val); //date time Y-m-d H:i:s
        case "T":
          return validator.isTime(val,{mode:'withSeconds'})
          // return /^[0-2]{1}[0-9]{1}:[0-5]{1}[0-9]{1}:[0-5]{1}[0-9]{1}$/.test(val); //date time Y-m-d H:i:s
        case "A":
          return validator.isAlpha(val) //alpha without space
          // return /^([A-Za-z]+)$/.test(val); //alpha without space
        case "AS":
          return validator.isAlpha(val, 'en-US', {ignore:" "}) //alpha with space
          // return /^[A-Za-z ]+$/.test(val); //alpha with space
        case "AN":
          return validator.isAlphanumeric(val) //alpha numeric without space
          // return /^([A-Z0-9a-z]+)$/.test(val); //alpha numeric without space
        case "ASN":
          return validator.isAlphanumeric(val,'en-US', {ignore: " "}) //alpha numeric with space
          // return /^[A-Za-z 0-9]+$/.test(val); //alpha numeric with space
        case "N":
          return validator.isNumeric(val) //numeric
          // return /^(-)?\d+$/.test(val); //numeric
        case "F":
          return validator.isFloat(val) //Float
          // return /^(-)?\d+\.?\d*$/.test(val); //Float
        case "ANS":
          return validator.matches(val, /^[A-Za-z 0-9_\-+!:=?.,'@#%\/\&\(\)\[\]]+$/); //text
          // return /^[A-Za-z 0-9_\-+!:=?.,'@#%\/\&\(\)\[\]]+$/.test(val); //text
        case "EMAIL":
          return validator.isEmail(val)
        case "PAN":
          return this.validatePAN(val); //PAN NO.
        case "MNO":
          return validator.isMobilePhone(val)
        case "PIN":
          return /^\d{6}$/.test(val); //Pin No.
        case "AU":
          return validator.isAlpha(val, 'en-US', {ignore:"_"}) //alpha with underscore
          // return /^[A-Za-z_]+$/.test(val); //alpha with underscore
        case "URL":
          return /^http(s)?:\/\/[a-z0-9-]+(.[a-z0-9-]+)*(:[0-9]+)?(?:.)*?$/.test(
            val
          ); //URL
        case "VER":
          return /^\d{1,2}.\d{1,2}.\d{1,2}$/.test(val); //Version No.
        case "IPV4":
          return validator.isIP(val,4);
        case "MAC":
          return validator.isMACAddress(val)
          // return /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(val); // MAC Address
        case "IMEI":
          return validator.isIMEI(val);
          // return this.isValidIMEI(val); //IMEI Number
        case "SIM":
          return validator.matches(val, /^\d{19,20}$/); // SIM cared number
          // return this.isValidICCID(val); // SIM cared number
        case "ANY":
          return true;
        default:
          return false;
      }
    }
  
    // Validates PAN number
    static validatePAN(pan_no: string): boolean {
      let PANNO: string = pan_no.trim().toUpperCase();
      if (PANNO.length !== 10) {
        return false;
      }
      let pan_arr:Array<string> = PANNO.split("");
      for (let key = 0; key < 10; key++) {
        let val: number = pan_arr[key].charCodeAt(0);
        if ((key === 9 || key <= 4) && (val < 65 || val > 90)) {
          return false;
        } else if (key > 4 && key <= 8 && (val < 48 || val > 57)) {
          return false;
        } else if (
          key === 3 &&
          ",A,B,C,F,G,H,J,L,P,T,".indexOf("," + pan_arr[key] + ",") !== -1
        ) {
          return false;
        }
      }
      return true;
    }
  
    
    // Merges req.query and req.body
    static obj_merge(request_query_body: Record<string, any>, ...sources: Record<string, any>[]): Record<string, any> {
        sources.forEach((source: Record<string, any>) => {
            for (const prop in source) {
                if (Object.prototype.hasOwnProperty.call(source, prop)) {
                    request_query_body[prop] = source[prop];
                }
            }
        });
        return request_query_body;
    }
  
    // Converts two Date(time) difference in human redable format
    static date_diff_toString(date1: Date, date2: Date): string {
      let diff: number = Math.abs(this.date_diff(date1, date2, "S"));
      let out: string = "" + (diff % 60) + "s";
      diff = Math.floor(diff / 60);
      if (diff >= 60) {
        out = "" + (diff % 60) + "m " + out;
        diff = Math.floor(diff / 60);
        if (diff >= 24) {
          out = "" + (diff % 24) + "h " + out;
          diff = Math.floor(diff / 24);
          if (diff > 0) {
            out = "" + diff + "d " + out;
          }
        } else if (diff > 0) {
          out = "" + diff + "h " + out;
        }
      } else if (diff > 0) {
        out = "" + diff + "m " + out;
      }
      return out;
    }
  
    // Converts two Date difference in human redable format
    static date_diff(date1: Date | string | number, date2: Date | string | number, diff_in?: "Y" | "M" | "D" | "H" | "I" | "S"): number {
      if (diff_in === undefined) {
        diff_in = "D";
      }
      const date_1 = new Date(date1);
      const date_2 = new Date(date2);
      let Diff = date_1.getTime() - date_2.getTime();
      switch (diff_in) {
        case "Y":
          Diff /= 12;
        case "M":
          Diff /= 30;
        case "D":
          Diff /= 24;
        case "H":
          Diff /= 60;
        case "I":
          Diff /= 60;
        case "S":
        default:
          Diff /= 1000;
      }
      return Math.floor(Diff);
    }
  
    // Returns IPV4 remote address
    static get_ipv4_addr(mixed: string | undefined | null): string {
      let ipv4 = "";
      (mixed || "").split(":").forEach(function (v) {
        let ip = (v || "").split(".");
        if (ip.length === 4) {
          let f = true;
          ip.forEach(function (i) {
            const num = parseInt(i, 10); // Convert i to a number
            if (num < 0 || num > 255 || isNaN(num)) {
              f = false;
            }
          });
          if (f) {
            ipv4 = v;
          }
        }
        if (ipv4.length > 0) {
          return false;
        }
      });
      return ipv4;
    }
  
    static generateSequentialCode(prefix: string, id: number|string, text: string = "0000"): string {
      let newId: string = id.toString();
      let ln: number = newId.length;
      let code: string = prefix + newId;
      if (ln < text.length) {
        let substring = text.substring(0, text.length - ln);
        code = prefix + substring + newId;
      }
      return code;
    }
    static formateUserName = (firstName: string, middleName: string = "", lastName: string = ""): string => {
      let fullName: string = firstName;
  
      if (middleName !== "") {
        fullName += " " + middleName;
      }
  
      if (lastName !== "") {
        fullName += " " + lastName;
      }
      return fullName;
    };
  
    static isValidIMEI(imei:string): boolean {
      // Ensure the IMEI is a string and has 15 digits
      if (!/^\d{15}$/.test(imei)) {
        return false;
      }
  
      let sum: number = 0;
      for (let i = 0; i < 15; i++) {
        let digit: number = parseInt(imei.charAt(i), 10);
  
        // Double every second digit
        if (i % 2 !== 0) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }
  
        sum += digit;
      }
  
      // The IMEI is valid if the sum is a multiple of 10
      return sum % 10 === 0;
    }
  
    static isValidICCID(iccid: string):boolean {
      // Ensure the ICCID is a string and has 19 or 20 digits
      if (!/^\d{19,20}$/.test(iccid)) {
        return false;
      }
  
      // Implement the Luhn algorithm
      let sum: number = 0;
      for (let i = 0; i < iccid.length; i++) {
        let digit: number = parseInt(iccid.charAt(iccid.length - 1 - i), 10);
  
        // Double every second digit from the right
        if (i % 2 === 1) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }
  
        sum += digit;
      }
  
      // The ICCID is valid if the sum is a multiple of 10
      return sum % 10 === 0;
    }
  }
  
  export default Util;
  