export const getQueryString = (search: string, name: string) => {
    if (!search) return '';
    const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)');
    const result = search.substring(1).match(reg);
    if (result != null) return result[2];
    return '';
};

export const isInWhiteList = (url: string = '', list: string[] = []) => {
    const baseUrl = url.split('?')[0];
    for (let whiteApi of list) {
        if (baseUrl.endsWith(whiteApi)) {
            return true;
        }
    }
    return false;
};
