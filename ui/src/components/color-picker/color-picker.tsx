import '@/styles/theme.less';
import React from 'react';
import style from './color-picker.module.less';

const ColorPicker: React.FC = () => {
    const toColor = (color: 'green' | 'blue' | 'orange' | 'red') => {
        return () => {
            console.log('to{$color}')
            const root = document.querySelector(':root')
            if (root) {
                root.setAttribute('theme', color);
            }
        }
    }

    return (<div className={style.colorpicker}>
        <div className={style.green} onClick={toColor('green')}></div>
        <div className={style.blue} onClick={toColor('blue')}></div>
        <div className={style.orange} onClick={toColor('orange')}></div>
        <div className={style.red} onClick={toColor('red')}></div>
    </div>)
}

export default ColorPicker
