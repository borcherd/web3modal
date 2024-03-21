import { css } from 'lit'

export default css`
  :host {
    width: 100%;
    height: 100px;
    border-radius: var(--wui-border-radius-s);
    border: 1px solid var(--wui-gray-glass-002);
    background-color: var(--wui-gray-glass-002);
    transition: all var(--wui-ease-out-power-1) var(--wui-duration-lg);
    position: relative;
  }

  :host(:hover) {
    background-color: var(--wui-gray-glass-005);
  }

  .instruction {
    font-weight: var(--wui-font-weight-medium);
    font-size: var(--wui-font-size-paragraph);
  }
`
