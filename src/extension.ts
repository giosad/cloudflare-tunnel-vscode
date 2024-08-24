import * as vscode from "vscode";
import { CloudflaredClient } from "./cmd/cloudflared";
import { commands } from "./commands/index";
import { cloudflareTunnelProvider } from "./providers/tunnels";
import { GlobalState } from "./state/global";
import * as constants from "./constants";
import { setContext } from "./utils";

let cloudflared: CloudflaredClient;

export async function activate(context: vscode.ExtensionContext) {
  // State
  const globalState = GlobalState.init(context);

  // Setup Cloudflared client
  cloudflared = await CloudflaredClient.init(context);

  // Activate commands
  for (const callback of commands) {
    const commandId = `${constants.prefix}.${callback.name}`;
    const command = vscode.commands.registerCommand(commandId, callback);
    context.subscriptions.push(command);
  }

  // Register providers
  vscode.window.registerTreeDataProvider(
    constants.Views.list,
    cloudflareTunnelProvider
  );

  // Context keys
  setContext(constants.Context.isLoggedIn, globalState.isLoggedIn);
}

// this method is called when your extension is deactivated
export async function deactivate() {
  const tunnels = cloudflareTunnelProvider.tunnels;
  for (const tunnel of tunnels) {
    if (tunnel.process) {
      await cloudflared.stop(tunnel);
    }
    if (!tunnel.isQuickTunnel) {
      await cloudflared.deleteTunnel(tunnel);
    }
  }
}
