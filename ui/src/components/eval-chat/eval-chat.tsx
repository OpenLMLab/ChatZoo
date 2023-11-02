import * as react from 'react';
import { sseMesage } from 'chat-webkit/dist/types/components/chat-box/chatInterface';
import React from 'react';
import styles from '@/components/eval-chat/eval-chat.module.less';

interface EvalChatProps {
    propsSessionList: sseMesage[];
    style?: React.CSSProperties;
    userAvatar?: JSX.Element;
    modelAvatar?: JSX.Element;
}

const EvalChat: React.FC<EvalChatProps> = ({ propsSessionList, style, userAvatar, modelAvatar }) => {

    return (
        <div>
            {
                propsSessionList.map((sessionList: sseMesage) => {
                    return (
                        <div className={styles.chatItem_module_questionRow}>
                            <div className={styles.chatItem_module_userAvatar}>
                                {userAvatar}
                            </div>
                            <div className={styles.chatItem_module_messageContainer}>
                                <pre>{sessionList.question}</pre>
                            </div>
                        </div>
                    )
                })
            }


        </div>
    );
}

export default EvalChat;