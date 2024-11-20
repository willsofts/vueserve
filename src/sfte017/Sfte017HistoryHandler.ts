import { KnModel, KnOperation, KnPageSetting, KnActionQuery } from "@willsofts/will-db";
import { KnDBConnector, KnSQLInterface, KnRecordSet, KnSQL } from "@willsofts/will-sql";
import { HTTP } from "@willsofts/will-api";
import { KnValidateInfo, KnContextInfo, KnDataTable } from '@willsofts/will-core';
import { VerifyError } from '@willsofts/will-core';
import { KnUtility } from '@willsofts/will-core';
import { TknOperateHandler } from '@willsofts/will-serv';

export class Sfte017HistoryHandler extends TknOperateHandler {

    public progid = "sfte017";
    public model : KnModel = { 
        name: "tuserfactorhistory", 
        alias: { privateAlias: this.section }, 
        fields: {
            userid: { type: "STRING", key: true },
            email: { type: "STRING" },
            issuer: { type: "STRING" },
            createdate: { type: "DATE" },
            createtime: { type: "TIME" },
            confirmdate: { type: "DATE" },
            confirmtime: { type: "TIME" },
            factorflag: { type: "STRING" },
        },
    };

    /* try to validate fields for insert, update, delete, retrieve */
    protected override validateRequireFields(context: KnContextInfo, model: KnModel, action: string) : Promise<KnValidateInfo> {
        let vi = this.validateParameters(context.params,"userid");
        if(!vi.valid) {
            return Promise.reject(new VerifyError("Parameter not found ("+vi.info+")",HTTP.NOT_ACCEPTABLE,-16061));
        }
        return Promise.resolve(vi);
    }

    protected override buildFiltersQuery(context: KnContextInfo, model: KnModel, knsql: KnSQLInterface, actions: KnActionQuery): KnSQLInterface {
        if(this.isCollectMode(actions.action)) {
            let params = context.params;
            knsql.append(actions.selector);
            knsql.append(" from ");
            knsql.append(model.name);
            let filter = " where ";
            if(params.userid && params.userid!="") {
                knsql.append(filter).append(model.name).append(".userid = ?userid ");
                knsql.set("userid",params.userid);
                filter = " and ";
            }
            return knsql;    
        }
        return super.buildFiltersQuery(context, model, knsql, actions);
    }

    protected override buildOrderQuery(context: any, model: KnModel, knsql: KnSQLInterface, pageSetting: KnPageSetting, actions?: KnActionQuery): KnSQLInterface {
        let order = pageSetting.orderDir?pageSetting.orderDir:"";
        if("createdatetime"==pageSetting.orderBy) {
            knsql.append(" order by createdate ").append(order).append(", createtime ").append(order).append(" ");
            return knsql;
        } else if("confirmdatetime"==pageSetting.orderBy) {
            knsql.append(" order by confirmdate ").append(order).append(", confirmtime ").append(order).append(" ");
            return knsql;
        }
        return super.buildOrderQuery(context, model, knsql, pageSetting, actions);
    }

    protected override async doRetrieving(context: KnContextInfo, model: KnModel, action: string = KnOperation.RETRIEVE): Promise<KnDataTable> {
        let db = this.getPrivateConnector(model);
        try {
            let rs = await this.performRetrieving(context, model, db);
            if(rs.rows.length>0) {
                let row = this.transformData(rs.rows[0]);
                let result = {action: action, entity: {}, dataset: row};
                return result;
            }
            return this.recordNotFound();
        } catch(ex: any) {
            this.logger.error(this.constructor.name,ex);
            return Promise.reject(this.getDBError(ex));
		} finally {
			if(db) db.close();
        }
    }

    public async performRetrieving(context: KnContextInfo, model: KnModel, db: KnDBConnector): Promise<KnRecordSet> {
        let knsql = new KnSQL();
        knsql.append("select ").append(this.buildSelectField(context,model)).append(" ");
        knsql.append("from ").append(model.name).append(" ");
        knsql.append("where userid = ?userid ");
        knsql.set("userid",context.params.userid);
        let rs = await knsql.executeQuery(db);
        return this.createRecordSet(rs);
    }
    
    /**
     * Override for search action (return data collection)
     * @param context 
     * @param model 
     * @returns KnDataTable
     */
    public override async getDataSearch(context: KnContextInfo, model: KnModel) : Promise<KnDataTable> {
        let dt = await this.doCollect(context, model);
        dt.renderer = "sfte017/sfte017_history_data";
        return dt;
    }

    /**
     * Override for retrieval action (return record not found error if not found any record)
     * @param context 
     * @param model 
     * @returns KnDataTable
     */
    public override async getDataRetrieval(context: KnContextInfo, model: KnModel) : Promise<KnDataTable> {
        let dt = await this.getDataSearch(context, model);
        dt.renderer = "sfte017/sfte017_dialog";
        return dt;
    }

    public async getAccountName(context: KnContextInfo, model: KnModel) : Promise<string> {
        let db = this.getPrivateConnector(model);
        try {
            return await this.fetchAccountName(db, context.params.userid, context);
        } catch(ex: any) {
            this.logger.error(this.constructor.name,ex);
            return Promise.reject(this.getDBError(ex));
        } finally {
            if(db) db.close();
        }
    }

    public async fetchAccountName(db: KnDBConnector, userid: string, context?: any) : Promise<string> {
        let eng = KnUtility.isEnglish(context);
        let knsql = new KnSQL();
        knsql.append("select ");
        if(eng) {
            knsql.append("userename as username, useresurname as usersurname ");
        } else {
            knsql.append("usertname as username, usertsurname as usersurname ");		
        }
        knsql.append("from tuserinfo where userid = ?userid ");
        knsql.set("userid",userid);
        let rs = await knsql.executeQuery(db,context);
        if(rs.rows.length>0) {
            return rs.rows[0].username+" "+rs.rows[0].usersurname;
        }
        return "";
    }

    protected override async doCollect(context: KnContextInfo, model: KnModel) : Promise<KnDataTable> {
        let db = this.getPrivateConnector(model);
        try {
            let rs = await this.performFinding(context, model, db, KnOperation.COLLECT);
            let name = await this.fetchAccountName(db, context.params.userid, context);
            let dt = this.createDataTable(KnOperation.COLLECT, this.createRecordSet(rs));
            dt.meta = {userid: context.params.userid, userfullname: name};
            return dt;
        } catch(ex: any) {
            this.logger.error(this.constructor.name,ex);
            return Promise.reject(this.getDBError(ex));
        } finally {
            if(db) db.close();
        }
    }

}
