import KnAPI from "@willsofts/will-api";
import { ServiceSchema } from "moleculer";
import { KnExpress, KnRunner } from "@willsofts/will-run";
import { TknAssureHandler } from "@willsofts/will-core";
import { TknRouteManager } from '@willsofts/will-serv';
import { TknSAMLManager } from '@willsofts/will-serv';
import { TknReportManager } from '@willsofts/will-serv';
import { TknUploadFileManager } from "@willsofts/will-serv";

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
        runner.service.logger.info("working directory",__dirname);
        new TknRouteManager(runner.service, __dirname).route(app);
        //this for SAML login supported
        new TknSAMLManager(runner.service, __dirname).route(app);
        //this is report operator
        new TknReportManager(runner.service, __dirname).route(app);
        //this is private upload file router
        new TknUploadFileManager(runner.service, __dirname).route(app);
    }
    if(runner.broker) {
        runner.broker.call("$node.services").then((services: any) => {
            let servicenames = [];
            for(let s of services) {
                if(s.name!="$node" && s.name!="api") {
                    servicenames.push(s.name);
                }
            }
            if(runner.service) {
                runner.service.logger.debug("service names",servicenames);
                runner.service.logger.debug("number of services",servicenames.length);
            } else {
                console.debug("service names",servicenames);
                console.log("number of services",servicenames.length);
            }
        });
    }
});
