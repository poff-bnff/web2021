import React from 'react'
import { Padded, Text, Flex } from '@buffetjs/core';
import { useIntl } from 'react-intl';
import { NotificationWrapper, IconWrapper, LinkArrow, RemoveWrapper } from './styledComponents';






const links = (propLinks) => {
    const { formatMessage } = useIntl();
    const formattedMessage = msg => (typeof msg === 'string' ? msg : formatMessage(msg, msg.values));

    let links = ''



    console.log(propLinks);
    return propLinks.props.map((a, index) => {
       return (
            <a key={index} href={a.url} target="_blank" rel="noopener noreferrer">
                <Padded left size="xs">
                    <Flex alignItems="center">
                        <Text
                            style={{ maxWidth: '320px' }}
                            ellipsis
                            fontWeight="bold"
                            color="blue"
                            title={formattedMessage(a.label)}
                        >
                            {formattedMessage(a.label)}
                        </Text>
                        <Padded left size="xs" />
                        <LinkArrow />
                    </Flex>
                </Padded>
            </a>)
    })
}


export default links