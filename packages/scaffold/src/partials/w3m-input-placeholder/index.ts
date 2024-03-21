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
      flexDirection="row"
      justifyContent="center"
      alignItems="center"
      gap="4xs"
      .padding=${['xl', 'l', 'xl', 'l'] as const}
    >
      <wui-icon-box
        ?border=${false}
        icon="linkConnect"
        size="s"
        backgroundColor="glass-005"
        iconColor="accent-100"
        iconSize="s"
      ></wui-icon-box>
      <wui-text class="instruction" color="accent-100" variant="medium-400" icon="search">
        Generate link
      </wui-text>
    </wui-flex>`
  } // TODO: Icon and text have diff colours

  // -- Private ------------------------------------------- //
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-input-placeholder': W3mInputPlaceholder
  }
}
