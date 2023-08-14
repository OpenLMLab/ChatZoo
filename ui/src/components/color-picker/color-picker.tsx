import { ColorPicker as AntDColorPicker } from 'antd';
import { Color } from 'antd/es/color-picker';
import { ColorFactory } from 'antd/es/color-picker/color';
import React from 'react';
import style from './color-picker.module.less';

const ColorPicker: React.FC = () => {
    const toColor = (color: 'green' | 'blue' | 'orange' | 'red') => {
        return () => {
            console.log('to{$color}');
            const root = document.querySelector(':root');
            if (root instanceof HTMLElement) {
                root.style.removeProperty('--primary')
                root.style.removeProperty('--background-gradient')
                root.setAttribute('theme', color);
            }
        };
    };

    const handleCustomColor = (color: Color) => {
        const root = document.querySelector(':root');
        const hsb = color.toHsb();
        const bGradStart = new ColorFactory({ h: hsb.h, s: hsb.s, b: hsb.b - 0.1 });
        if (root instanceof HTMLElement) {
            root.style.setProperty('--primary', color.toHexString())
            root.style.setProperty('--background-gradient', `linear-gradient(117.2deg, ${bGradStart.toHexString()} 10.6%, #41464a 90.8%)`)
        }
    }

    return (
        <div className={style.colorpicker}>
            <div onClick={toColor('green')}>
                <AntDColorPicker className={style.color} disabled value='#4c8f70' />
            </div>
            <div onClick={toColor('blue')}>
                <AntDColorPicker className={style.color} disabled value="#598aa0" />
            </div>
            <div onClick={toColor('orange')}>
                <AntDColorPicker className={style.color} disabled value='#9a9a4c' />
            </div>
            <div onClick={toColor('red')}>
                <AntDColorPicker className={style.color} disabled value='#a05959' />
            </div>
            <AntDColorPicker className={`${style.custom}`} onChangeComplete={(color) => handleCustomColor(color)} />
        </div >
    );
};

export default ColorPicker;
