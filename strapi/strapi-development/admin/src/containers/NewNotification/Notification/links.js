import React from 'react'
import { Padded, Text, Flex } from '@buffetjs/core';
import { useIntl } from 'react-intl';
import { LinkArrow } from './styledComponents';






const links = (propLinks) => {
    const { formatMessage } = useIntl();
    const formattedMessage = msg => (typeof msg === 'string' ? msg : formatMessage(msg, msg.values));

    return propLinks.props.map((a, index) => {
        console.log(a);
       return (
            <a key={index} href={a.url} target="_blank" rel="noopener noreferrer">
                <Padded left size="xs">
                    <Flex alignItems="center">
                        <Text
                            style={{ maxWidth: '320px'}}
                            ellipsis
                            fontWeight={"bold"}
                            color={a.color || "blue"}
                            title={formattedMessage(a.label)}
                        >
                            {formattedMessage(a.label)}
                        </Text>
                        <Padded left size="xs" />
                        {!a.color && (<LinkArrow />)}
                    </Flex>
                </Padded>
            </a>)
    })
}


export default links