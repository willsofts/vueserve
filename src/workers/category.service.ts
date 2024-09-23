import KnService from "@willsofts/will-db";
import { ServiceSchema } from "moleculer";
import { Utilities } from "@willsofts/will-util";
import { HTTP } from "@willsofts/will-api";
import { TknDataTableHandler, VerifyError } from '@willsofts/will-core';
import { DB_SECTION } from "../utils/EnvironmentVariable";
import { KnCategory } from "@willsofts/will-serv";
import { TheCategories } from "@willsofts/will-serv";
import { TknExposeHandler } from "@willsofts/will-core";

const CategoryService : ServiceSchema = {
    name: "category",
    mixins: [KnService],
    model: {
        name: "tcategory",
        alias: { privateAlias: DB_SECTION },
    },
    settings: {
        disableColumnSchema: true, //do not return column schema
        disableQueryPaging: true, //do not paging
    },
    actions: {
        async groups(context: any) {
            let exposer = new TknExposeHandler();
            exposer.logger = this.logger;
            let params = await exposer.exposeCipher(context);
            let names = params.names;
            if(!names) names = params["names[]"];
            if(Utilities.isString(names)) {
                names = names.split(",");
            }
            this.logger.debug("names",names);
            if(!names || names.length==0) {
                return Promise.reject(new VerifyError("Parameter not found (names)",HTTP.NOT_ACCEPTABLE,-16061));
            }
            let handler = new TknDataTableHandler();
            let userToken = await handler.getUserTokenInfo(context, true);
            let settings = KnCategory.getSetting(context, TheCategories.getSetting, userToken, ...names);
            let db = handler.getConnector(DB_SECTION);
            try {
                return await handler.getDataCategory(db, settings, true, context); 
            } catch(ex: any) {
                this.logger.error(this.constructor.name,ex);
                return Promise.reject(handler.getDBError(ex));
            } finally {
                if(db) db.close();
            }
        },
        async lists(context: any) {
            let exposer = new TknExposeHandler();
            exposer.logger = this.logger;
            let params = await exposer.exposeCipher(context);
            let names = params.names;
            if(!names) names = params["names[]"];
            if(Utilities.isString(names)) {
                names = names.split(",");
            }
            this.logger.debug("names",names);
            if(!names || names.length==0) {
                return Promise.reject(new VerifyError("Parameter not found (names)",HTTP.NOT_ACCEPTABLE,-16061));
            }
            let handler = new TknDataTableHandler();
            let userToken = await handler.getUserTokenInfo(context, true);
            let settings = KnCategory.getSetting(context, TheCategories.getSetting, userToken, ...names);
            let db = handler.getConnector(DB_SECTION);
            try {
                return await handler.getDataTable(db, settings, true, context); 
            } catch(ex: any) {
                this.logger.error(this.constructor.name,ex);
                return Promise.reject(handler.getDBError(ex));
            } finally {
                if(db) db.close();
            }
        },
    }    
}
export = CategoryService;
