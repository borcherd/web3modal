import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import styles from './styles.js'
@customElement('w3m-input-placeholder')
export class W3mInputPlaceholder extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //

  // -- State & Properties -------------------------------- //

  // -- Render -------------------------------------------- //
  public override render() {
    return html` <wui-flex
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      gap="4xs"
      .padding=${['2xl', 'l', 'xl', 'l'] as const}
    >
      <wui-text class="instruction" color="accent-100" variant="medium-400">
        Generate link
      </wui-text>
    </wui-flex>`
  }

  // -- Private ------------------------------------------- //
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-input-placeholder': W3mInputPlaceholder
  }
}
