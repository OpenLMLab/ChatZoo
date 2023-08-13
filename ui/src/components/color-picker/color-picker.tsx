import '@/styles/theme.less';
import React from 'react';
import style from './color-picker.module.less';

const ColorPicker: React.FC = () => {
    const toColor = (color: 'green' | 'blue' | 'orange' | 'red') => {
        return () => {
            console.log('to{$color}');
            const root = document.querySelector(':root');
            if (root) {
                root.setAttribute('theme', color);
            }
        };
    };
    return (
        <div className={style.colorpicker}>
            <div className={style.green} onClick={toColor('green')}></div>
            <div className={style.blue} onClick={toColor('blue')}></div>
            <div className={style.orange} onClick={toColor('orange')}></div>
            <div className={style.red} onClick={toColor('red')}></div>
            <div>
                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="24" viewBox="0 0 25 24" fill="none">
                    <path
                        d="M12.0938 3C12.646 3 13.0938 3.44772 13.0938 4V11H20.0938C20.646 11 21.0938 11.4477 21.0938 12C21.0938 12.5523 20.646 13 20.0938 13H13.0938V20C13.0938 20.5523 12.646 21 12.0938 21C11.5415 21 11.0938 20.5523 11.0938 20V13H4.09375C3.54147 13 3.09375 12.5523 3.09375 12C3.09375 11.4477 3.54147 11 4.09375 11H11.0938V4C11.0938 3.44772 11.5415 3 12.0938 3Z"
                        fill="black"
                    />
                </svg>
            </div>
        </div>
    );
};

export default ColorPicker;
