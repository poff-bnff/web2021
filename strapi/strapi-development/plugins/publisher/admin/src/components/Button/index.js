import styled from 'styled-components';
import { Button as Base } from '@buffetjs/core';

const Button = styled(Base)`
  width: 150px;
  text-transform: ${({ textTransform }) => textTransform};
  background: #F36C3F;
  border: #F36C3F;
`;

Button.defaultProps = {
  color: 'primary',
  type: 'button',
  textTransform: 'none',
};

export default Button;
