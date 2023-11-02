import React, { useContext, useEffect, useState } from 'react';
import style from './evaloverall.module.less';
import { Table } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import http from '@/utils/axios';
import { ModelContext } from '@/utils/modelcontext';
import ModelConfig from '../model/model';
import eventBus from '@/utils/eventBus';

const EvalOverall: React.FC = () => {
    const overallItem = JSON.parse(localStorage.getItem("overallItems")!)
    const models = useContext(ModelContext)?.models;
    let columns: ColumnsType<any> = [{ title: "模型", dataIndex: "model" }];
    overallItem.forEach((item: any) => {
        columns.push({
            title: item,
            dataIndex: item
        })
    })
    const initData = JSON.parse(localStorage.getItem("overallScore")!)
    const [data, setData] = useState<any>(initData)
    // const data: [] = [];

    const onChange: TableProps<any>['onChange'] = (pagination, filters, sorter, extra) => {
        console.log('params', pagination, filters, sorter, extra);
    };

    const dataChange = () => {
        let newData: any[] = []
        console.log("dataChange ->>>>")
        models?.forEach((model: ModelConfig, idx: number) => {
            http.get<string, any>(model.url + "/chat/get_overall_score?ds_name=" +
                localStorage.getItem("selectDs")).then((res) => {
                    let ds_data = res.data.data
                    ds_data['model'] = model.nickname
                    console.log("evaloverall setData --> ", ds_data)
                    newData.push(ds_data)
                    if (newData.length == Object.keys(models).length) {
                        setData(newData)
                    }
                })
        })
    }

    useEffect(() => {
        const dataChange = () => {
            let newData: any[] = []
            console.log("dataChange ->>>>")
            models?.forEach((model: ModelConfig, idx: number) => {
                http.get<string, any>(model.url + "/chat/get_overall_score?ds_name=" +
                    localStorage.getItem("selectDs")).then((res) => {
                        let ds_data = res.data.data
                        ds_data['model'] = model.nickname
                        console.log("evaloverall setData --> ", ds_data)
                        newData.push(ds_data)
                        if (newData.length == Object.keys(models).length) {
                            setData(newData)
                        }
                    })
            })
        }
        eventBus.on("overallShow", dataChange)
        return () => {
            eventBus.off("overallShow", dataChange)
        }
    })

    return (
        <Table className={style.main} columns={columns} dataSource={data} onChange={onChange}
            pagination={{ hideOnSinglePage: true }} />
    );
};

export default EvalOverall;
