import express, { Router, Request, Response, NextFunction } from "express";
import Util from "./Util";
const router = Router();

interface LogEntry {
  request_url: string;
  request_method: string;
  request_start_time: Date | undefined;
  request_end_time: Date;
  process_timestamp?: number;
  remote_addr: string;
  referer?: string;
  user_agent?: string;
  req_params: string;
  req_data: any; // Or a more specific type if known
  res_data: string;
  total_request_process_time: string;
  request_status?: string;
}

router.use(async (req: Request, res: Response, next: NextFunction) => {
  req.data = Util.obj_merge(req.query, req.body);
  req.begin_timestamp = new Date();
  let originalSend = res.send;
  // res.send = async function (body: any): Promise<Response> {
  res.send = function (body: any): Response {
    let end = new Date();
    try {
      let response: Record<string, any> = {};
      try {
        response = JSON.parse(body);
      } catch (error) {}
      if (response.hasOwnProperty("error") && !response.error) {
        delete response.data;
      }
      let log: LogEntry = {
        request_url: (
          req.protocol +
          "://" +
          req.get("host") +
          req.originalUrl
        ).split("?")[0],
        request_method: req.method,
        request_start_time: req.begin_timestamp,
        request_end_time: end,
        process_timestamp: end.getTime() - (req.begin_timestamp?.getTime() || 0),
        // process_timestamp?: end.getTime() - req.begin_timestamp!.getTime(),
        
        remote_addr: Util.get_ipv4_addr(req.socket.remoteAddress),
        referer: req.get("referer"),
        user_agent: req.get("user-agent"),
        req_params: JSON.stringify(req.params),
        req_data: req.method == "GET" ? req.query : req.body,
        res_data: JSON.stringify(response),
        total_request_process_time: // Add the property here
        Util.date_diff_toString(end, req.begin_timestamp || new Date(0)) + // Handle possible undefined
        " " +
        (end.getTime() - (req.begin_timestamp?.getTime() || 0)) % 1000 +
        "msc",
        request_status : !response.error ? "Success" : "Error"
      };
      if (log.req_data.password) {
        log.req_data.password = "**********";
      }
      log.req_data = JSON.stringify(log.req_data);
      // log.total_request_process_time =
      //   Util.date_diff_toString(log.request_end_time, log.request_start_time) +
      //   " " +
      //   (log.process_timestamp % 1000) +
      //   "msc";
      // log.request_status = !response.error ? "Success" : "Error";
      delete log.process_timestamp;
      console.log("log", log);
    } catch (error) {
      console.log(error);
    } finally {
      return originalSend.call(this, body);
    }
  };
  next();
});

export default router;
