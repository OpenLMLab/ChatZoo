import { Button, ConfigProvider, Input, Popover, message } from 'antd';
import React, { KeyboardEvent, useContext, useEffect, useState } from 'react';
import style from './evalbottom.module.less';
import type { PaginationProps } from 'antd';
import { Pagination } from 'antd';
import zh_CN from 'antd/es/locale/zh_CN';
import http from '@/utils/axios';
import { ModelContext } from '@/utils/modelcontext';
import eventBus from '@/utils/eventBus';


const EvalBottom: React.FC = () => {
    const models = useContext(ModelContext)?.models!;
    // 控制输入框禁用
    const [pageNum, setPageNum] = useState(100)
    // 控制当前页面的页数
    const [currentPage, setCurrentPage] = useState(1)

    let filterContent: any = {}
    if (localStorage.getItem("filterContent") === null || localStorage.getItem("filterContent") === undefined) {
        models.map((model) => {
            filterContent[model.nickname] = 'pass'
        })
        console.log("filterContent", localStorage.getItem("filterContent"), filterContent)
    } else {
        filterContent = JSON.parse(localStorage.getItem("filterContent")!)
    }
    // 初始化当前页面的内容
    if (pageNum == 100)
        http.post<any, any>('/get_length_by_filter_content?', {
            data: {
                ds_name: localStorage.getItem("selectDs"),
                content: JSON.stringify(filterContent)
            }
        }).then(res => {
            const curPageNum = res.data.data["ds_len"]
            setPageNum(curPageNum)
            console.log(curPageNum, "EvalBottom")
        })

    const pageChangeFn = (page: number, pageSize: number) => {
        console.log("页数改变，页数为", page, "每页条数", pageSize)
        eventBus.emit("eval_page_change", page, pageSize)
        setCurrentPage(page)
    }

    const itemRender: PaginationProps['itemRender'] = (_, type, originalElement) => {
        if (type === 'prev') {
            return <a>上一页</a>;
        }
        if (type === 'next') {
            return <a>下一页</a>;
        }
        return originalElement;
    };

    useEffect(() => {

        const getPageNum = () => {
            const ds_name = localStorage.getItem("selectDs")
            const model_name = models[0].nickname
            const data = {
                ds_name: ds_name,
                nickname: model_name
            }
            http.post<any, any>('/get_length_by_ds_name/?', { data: data }).then(res => {
                const curPageNum = res.data.data["ds_len"]
                setPageNum(curPageNum)
                console.log(curPageNum, "EvalBottom")
            })
        }
        const getFilterPageNum = (filterContent: any) => {
            const ds_name = localStorage.getItem("selectDs")
            const data = {
                ds_name: ds_name,
                content: JSON.stringify(filterContent),
            }
            http.post<any, any>('/get_length_by_filter_content?', { data: data }).then(res => {
                const curPageNum = res.data.data["ds_len"]
                setPageNum(curPageNum)
                console.log(curPageNum, "EvalBottom")
            })
        }

        const setCurrentPageFn = (new_cur_page: number) => {
            // 提供给manager组件使用的设置当前页面的数字，主要用于数据集的切换
            setCurrentPage(new_cur_page)
        }
        eventBus.on("getEvalPageNum", getPageNum)
        eventBus.on("getFilterPageNum", getFilterPageNum)
        eventBus.on("setCurrentPage", setCurrentPageFn)
        return () => {
            eventBus.off("getEvalPageNum", getPageNum)
            eventBus.off("getFilterPageNum", getFilterPageNum)
            eventBus.off("setCurrentPage", setCurrentPageFn)
        }
    })

    useEffect(() => {
        const nextPageFn = (e: KeyboardEvent) => {
            const keyCode = e.keyCode
            if (keyCode === 37) {

            } else if (keyCode === 39) {

            }
            console.log("keyCode: ", keyCode)
        }
        document.addEventListener('keyup', (e) => {
            console.log(e)
        })
        return () => {
            document.removeEventListener('keyup', (e) => {
                console.log(e)
            })
        }
    }, [EvalBottom])

    return (
        <ConfigProvider
            locale={zh_CN}
            theme={{
                components: {
                    Pagination: {
                        /* here is your component tokens */
                        itemActiveBg: 'rgba(255, 255, 255, 0.7)',
                        itemInputBg: 'rgba(255, 255, 255, 0.5)',
                        itemBg: 'rgba(255, 255, 255, 0.95)',
                        colorText: 'rgba(255, 255, 255, 0.9)',
                        itemLinkBg: 'rgba(255, 255, 255, 0.95)',
                        // colorPrimary: 'rgba(255, 255, 255, 1.0)'
                    },
                },
            }}
        >
            <div className={style.wrapper}>
                <Pagination responsive={true}
                    onChange={pageChangeFn}
                    pageSizeOptions={[1]} pageSize={1} current={currentPage}
                    showSizeChanger={false} showQuickJumper total={pageNum} itemRender={itemRender} />
            </div>
        </ConfigProvider>
    );
};

export default EvalBottom;
