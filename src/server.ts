import KnAPI from "@willsofts/will-api";
import { ServiceSchema } from "moleculer";
import { KnExpress, KnRunner } from "@willsofts/will-run";
import { TknAssureHandler } from "@willsofts/will-core";
import { TknRouteManager } from '@willsofts/will-serv';
import { TknSAMLManager } from '@willsofts/will-serv';
import { TknReportManager } from '@willsofts/will-serv';
import { UploadFileManager } from "./routers/UploadFileManager";

const ExpressService : ServiceSchema = {
    name: "api",
    mixins: [KnAPI],
    settings: {
        //when using express need to defined server = false
        server: false,
        path: "/api",
        routes: [
            {
                authorization: true,
                aliases: {
                    "GET fetch/hi/:name": "fetch.hi",
                    "GET fetch/time/:name": "fetch.time",
                    "GET fetch/config/:name": "fetch.config",

                    "POST sign/fetchtoken/:useruuid": "sign.fetchtoken",
                    "GET sign/fetchtoken/:useruuid": "sign.fetchtoken",
                }
            }
        ]
    },
    methods: {
        async authorize(ctx, route, req, res) {
            return TknAssureHandler.doAuthorizeFilter(ctx, req);
        }
    }
};
const runner = new KnRunner(ExpressService);
runner.start(process.argv).then(() => {
    if(runner.service) {
        let app = KnExpress.createApplication(runner.service);
        console.log("working directory",__dirname);
        new TknRouteManager(runner.service, __dirname).route(app);
        //this for SAML login supported
        new TknSAMLManager(runner.service, __dirname).route(app);
        //this is report operator
        new TknReportManager(runner.service, __dirname).route(app);
        //this is private upload file router
        new UploadFileManager(runner.service, __dirname).route(app);
    }
    if(runner.broker) {
        runner.broker.call("$node.services").then((services: any) => {
            let servicenames = [];
            for(let s of services) {
                if(s.name!="$node" && s.name!="api") {
                    servicenames.push(s.name);
                }
            }
            console.log("service names",servicenames);
            console.log("number of services",servicenames.length);
        });
    }
});
