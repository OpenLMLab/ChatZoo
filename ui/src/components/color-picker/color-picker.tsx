import '@/styles/theme.less';
import React from 'react';
import style from './color-picker.module.less';

const ColorPicker: React.FC = () => {
    const toGreen = () => {
        console.log('toGreen')
        const root = document.querySelector(':root')
        if (root) {
            root.setAttribute('theme', 'green');
        }
    }
    const toBlue = () => {
        console.log('toBlue')
        const root = document.querySelector(':root')
        if (root) {
            root.setAttribute('theme', 'blue');
        }

    }
    const toOrange = () => {
        console.log('toOrange')
        const root = document.querySelector(':root')
        if (root) {
            root.setAttribute('theme', 'orange');
        }
    }
    return (<div className={style.colorpicker}>
        <div className={style.green} onClick={toGreen}></div>
        <div className={style.blue} onClick={toBlue}></div>
        <div className={style.orange} onClick={toOrange}></div>
    </div>)
}

export default ColorPicker
