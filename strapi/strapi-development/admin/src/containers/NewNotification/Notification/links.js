import React from 'react'
import { Padded, Text, Flex } from '@buffetjs/core';
import { useIntl } from 'react-intl';
import { LinkArrow } from './styledComponents';

const links = (props) => {
    const { formatMessage } = useIntl();
    const formattedMessage = msg => (typeof msg === 'string' ? msg : formatMessage(msg, msg.values));

    if (!Array.isArray(props.links)) {
        return (
            <a key={props.links.url} href={props.links.url} target="_blank" rel="noopener noreferrer">
                <Padded left size="xs">
                    <Flex alignItems="center">
                        <Text
                            style={{ maxWidth: '320px' }}
                            ellipsis
                            fontWeight={"bold"}
                            color={props.links.color || "blue"}
                            title={formattedMessage(props.links.label)}
                        >
                            {formattedMessage(props.links.label)}
                        </Text>
                        <Padded left size="xs" />
                        {!props.links.color && (<LinkArrow />)}
                    </Flex>
                </Padded>
            </a>)
    } else {
        return props.links.map((a, index) => {
            return (
                <a key={index} href={a.url} target="_blank" rel="noopener noreferrer">
                    <Padded left size="xs">
                        <Flex alignItems="center">
                            <Text
                                style={{ maxWidth: '320px' }}
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
}


export default links
