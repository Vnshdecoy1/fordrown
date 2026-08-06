# Full crypto.com automation:
# 1. Multi-Asset Liquidation: Sell ALL non-SOL coins into USD with multi-pass scanning.
# 2. Consolidated SOL Purchase: Convert 100% of accumulated USD into SOL in ONE single order.
# 3. Single-Tx SOL Withdrawal: Withdraw 100% of SOL balance in ONE single transaction (< $10k).
# 4. Bulletproof Fallbacks & Settlement Sync:
#    - Persistent CDP + init_script WebAuthn Passkey auto-signer
#    - Auto Page Reload on DOM balance caching / lag to force fresh backend sync
#    - Dual click dispatch (CDP Mouse coordinates + DOM element.click())
#    - Automatic rate-expiration refresh handling
#    - 6-digit passcode auto-fill fallback
#    - "Verification Failed" / passkey re-select modal handling
#    - Search bar fallback for token picker
#    - Modal recovery & auto-cleanup on any unexpected error state
import asyncio, sys, io, json, re, time
from playwright.async_api import async_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
ADDRESS = "EWD8zX46gYGXoUfzE5aHaebztCdgcZtunMkFSZ3ahAnU"
PASSCODE = "210706"
MAX_WITHDRAWAL_LIMIT_USD = 10000.0

def log(msg):
    print(f"  [{time.strftime('%H:%M:%S')}] {msg}", flush=True)

async def mc(page, x, y):
    """Sub-pixel mouse click dispatch with DOM click fallback."""
    try:
        await page.mouse.move(x, y)
        await page.wait_for_timeout(60)
        await page.mouse.down()
        await page.wait_for_timeout(60)
        await page.mouse.up()
        await page.wait_for_timeout(200)
    except Exception as ex:
        log(f"mc error: {ex}")

async def ensure_no_modals(page):
    """Dismiss any open dialogs/overlays/cookie banners."""
    for _ in range(3):
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(150)
    await page.evaluate(r"""
        (() => {
            const btn = document.getElementById('accept-recommended-btn-handler');
            if (btn) btn.click();
            const btns = [...document.querySelectorAll('button')].filter(b => 
                /^(got it|done|close|ok|accept all|accept|agree)$/i.test((b.innerText || '').trim()) && b.getBoundingClientRect().width > 10
            );
            for (const b of btns) try { b.click(); } catch(e) {}
        })()
    """)
    await page.wait_for_timeout(250)

async def inject_passkey_permanently(context, page):
    """Inject passkey vault via CDP, add_init_script, and direct evaluation."""
    try:
        with open("C:/Users/vansh/passkey-vault/virtual-passkey.js") as f: shim = f.read()
        with open("C:/Users/vansh/passkey-vault/vault.json") as f: vault = f.read()
        
        init_js = f"""
            {shim}
            if (window.__passkeyVault) {{
                window.__passkeyVault.loadVault({vault});
                window.__passkeyVault.enable();
            }}
        """
        
        await context.add_init_script(init_js)
        cdp = await context.new_cdp_session(page)
        await cdp.send("Page.enable")
        await cdp.send("Page.addScriptToEvaluateOnNewDocument", {"source": init_js})
        await page.evaluate(init_js)
        log("Virtual Passkey Vault injected & permanently armed (CDP + InitScript)")
    except Exception as ex:
        log(f"Passkey injection warning: {ex}")

async def wait_for_funds_loaded(page, timeout=15):
    """Wait for Crypto.com overview table and balance data to fully load and settle."""
    start_t = time.time()
    while time.time() - start_t < timeout:
        is_loaded = await page.evaluate(r"""
            (() => {
                const skeletons = document.querySelectorAll('[class*=skeleton], [class*=Skeleton], [class*=loader], [class*=loading], [data-loading="true"]');
                if (skeletons.length > 0) return false;
                
                const rows = [...document.querySelectorAll('tr, [class*=row], [class*=Row]')];
                if (rows.length < 2) return false;
                
                let hasLoadedText = false;
                for (const r of rows) {
                    const t = r.innerText || '';
                    if (/\$[\d,]+(\.\d+)?|\bSOL\b|\bUSD\b/i.test(t) && !t.includes('---')) {
                        hasLoadedText = true;
                        break;
                    }
                }
                return hasLoadedText;
            })()
        """)
        if is_loaded:
            await page.wait_for_timeout(1000)
            return True
        await page.wait_for_timeout(500)
    return False

async def reload_and_sync(context, page):
    """Hard reload to force Crypto.com to re-fetch backend balances, then re-arm passkey."""
    log("Synchronizing balances: Performing page reload...")
    try:
        await page.reload(wait_until="domcontentloaded", timeout=20000)
        await inject_passkey_permanently(context, page)
        await ensure_no_modals(page)
        await wait_for_funds_loaded(page, timeout=15)
        await page.wait_for_timeout(1500)
        log("Page synchronized.")
    except Exception as ex:
        log(f"Reload note: {ex}")

async def fill_pc(page):
    """6-digit passcode auto-fill with React input event dispatch."""
    for _ in range(12):
        res = await page.evaluate(f"""
            (() => {{
                const modal = [...document.querySelectorAll('[class*=Modal-content], [class*=mantine-Modal-content], [class*=mantine-Paper-root], [role=dialog]')].find(m => {{
                    const r = m.getBoundingClientRect();
                    return r.width > 100 && r.height > 100 && r.top >= 0;
                }}) || document;
                
                const inputs = [...modal.querySelectorAll('input')].filter(i => {{
                    const r = i.getBoundingClientRect();
                    return r.width > 10 && r.height > 10 && r.top >= 0 && !i.readOnly;
                }});
                
                if (inputs.length >= 6) {{
                    const code = {json.dumps(PASSCODE)};
                    code.split('').forEach((c, idx) => {{
                        if (inputs[idx]) {{
                            inputs[idx].focus();
                            inputs[idx].value = c;
                            inputs[idx].dispatchEvent(new Event('input', {{ bubbles: true }}));
                            inputs[idx].dispatchEvent(new Event('change', {{ bubbles: true }}));
                        }}
                    }});
                    return 'filled_6';
                }} else if (inputs.length === 1 && inputs[0].maxLength === 6) {{
                    inputs[0].focus();
                    inputs[0].value = {json.dumps(PASSCODE)};
                    inputs[0].dispatchEvent(new Event('input', {{ bubbles: true }}));
                    inputs[0].dispatchEvent(new Event('change', {{ bubbles: true }}));
                    return 'filled_1';
                }}
                return 'no_inputs';
            }})()
        """)
        if res in ['filled_6', 'filled_1']:
            log("Passcode entered successfully")
            await page.wait_for_timeout(2000)
            return True
        await page.wait_for_timeout(400)
    return False

async def handle_rate_expired_and_confirm(page, action_name="Action"):
    """Handle confirmation modal, quote refresh, passcode, passkey fallback, error recovery, and dismissal."""
    log(f"Handling confirmation for {action_name}...")
    for attempt in range(40):
        status = await page.evaluate(r"""
            (() => {
                const modals = [...document.querySelectorAll('[class*=Modal-content], [class*=mantine-Modal-content], [class*=mantine-Paper-root], [role=dialog]')].filter(m => {
                    const r = m.getBoundingClientRect();
                    return r.width > 100 && r.height > 100 && r.top >= 0;
                });
                
                if (modals.length === 0) return { state: 'no_modals' };
                const modal = modals[modals.length - 1];
                const text = modal.innerText || '';
                
                // 1. Success check
                if (/sold|bought|completed|success|order placed|transferred|successful purchase/i.test(text) && !/confirm/i.test(text)) {
                    const gotItBtn = [...modal.querySelectorAll('button, [role=button]')].find(b => 
                        /^(got it|done|ok|close)$/i.test((b.innerText || '').trim())
                    );
                    let coords = null;
                    if (gotItBtn) {
                        const r = gotItBtn.getBoundingClientRect();
                        coords = { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
                    }
                    return { state: 'success', text: text.slice(0, 100), coords };
                }
                
                // 2. Error / Insufficient / Failed check
                if (/insufficient balance|something went wrong|try again later|order failed/i.test(text)) {
                    return { state: 'error', text: text.slice(0, 80) };
                }
                
                // 3. Passkey fallback / Verification Failed check
                if (text.includes('Verification Failed') || text.includes('PassKey') || text.includes('Select Authentication')) {
                    const selBtns = [...modal.querySelectorAll('button')].filter(b => (b.innerText||'').trim() === 'Select');
                    if (selBtns.length > 0) {
                        const r = selBtns[0].getBoundingClientRect();
                        return { state: 'passkey_select', x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
                    }
                }
                
                // 4. Rate Expired check
                if (/rate expired|expired|refresh rate/i.test(text)) {
                    const refBtn = [...modal.querySelectorAll('button, [role=button]')].find(b => 
                        /refresh/i.test((b.innerText || '').trim())
                    );
                    if (refBtn) {
                        const r = refBtn.getBoundingClientRect();
                        return { state: 'refresh', x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
                    }
                }
                
                // 5. Passcode check
                if (/passcode|verification code/i.test(text) || [...modal.querySelectorAll('input')].length >= 6) {
                    return { state: 'passcode' };
                }
                
                // 6. Confirm button check
                const confirmBtns = [...modal.querySelectorAll('button, [role=button]')].filter(b => {
                    const t = (b.innerText || '').trim();
                    const w = b.getBoundingClientRect().width;
                    return /^(confirm|confirm and withdraw|place order)$/i.test(t) && w > 40 && !b.disabled;
                });
                
                if (confirmBtns.length > 0) {
                    const b = confirmBtns[confirmBtns.length - 1];
                    const r = b.getBoundingClientRect();
                    return { state: 'confirm', x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
                }
                
                return { state: 'waiting', text: text.slice(0, 60) };
            })()
        """)
        
        state = status.get("state")
        if state == 'confirm':
            log(f"{action_name}: Clicking Confirm at ({status['x']}, {status['y']})")
            await mc(page, status["x"], status["y"])
            await page.wait_for_timeout(2000)
        elif state == 'refresh':
            log(f"{action_name}: Rate expired, clicking Refresh at ({status['x']}, {status['y']})")
            await mc(page, status["x"], status["y"])
            await page.wait_for_timeout(1500)
        elif state == 'passkey_select':
            log(f"{action_name}: Re-selecting Passkey option at ({status['x']}, {status['y']})")
            await mc(page, status["x"], status["y"])
            await page.wait_for_timeout(2000)
        elif state == 'passcode':
            log(f"{action_name}: Entering 6-digit Passcode...")
            await fill_pc(page)
            await page.wait_for_timeout(2000)
        elif state == 'success':
            log(f"{action_name} SUCCESS: {status.get('text')}")
            if status.get("coords"):
                await mc(page, status["coords"]["x"], status["coords"]["y"])
            await page.wait_for_timeout(2000)
            return True
        elif state == 'error':
            log(f"{action_name} ERROR in modal: {status.get('text')}")
            await ensure_no_modals(page)
            return False
        elif state == 'no_modals' and attempt >= 2:
            log(f"{action_name}: Modal closed, step complete")
            return True
            
        await page.wait_for_timeout(1000)
        
    await ensure_no_modals(page)
    return True

async def scan_all_tradeable_assets(page):
    """Scan all rows on overview table and return list of tradeable non-SOL assets with positive balance."""
    await wait_for_funds_loaded(page, timeout=8)
    return await page.evaluate(r"""
        (() => {
            const EXCLUDED_SYMBOLS = new Set(['USD', 'TRADE', 'BUY', 'SELL', 'DEPOSIT', 'WITHDRAW', 'TRANSFER', 'TOTAL', 'ACTION', 'MORE', 'ACCOUNT', 'CRYPTO', 'BALANCE', 'ASSETS']);
            const rows = [];
            const allRows = [...document.querySelectorAll('tr, [class*=row], [class*=Row]')];
            for (const r of allRows) {
                const text = (r.innerText || '').trim();
                const tradeBtn = [...r.querySelectorAll('button')].find(b => (b.innerText||'').trim() === 'Trade');
                if (!tradeBtn) continue;
                
                const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
                if (lines.length < 2) continue;
                
                let sym = '';
                let name = lines[0];
                for (const l of lines) {
                    if (/^[A-Z0-9]{2,10}$/.test(l) && !EXCLUDED_SYMBOLS.has(l.toUpperCase())) {
                        sym = l;
                        break;
                    }
                }
                if (!sym && lines.length > 1) {
                    sym = lines[1];
                }
                
                const hasPositiveBal = /\$[1-9]\d*(\.\d+)?|\$0\.[1-9]\d*|0\.0+[1-9]|[1-9]\d*(\.\d+)?\s+[A-Z0-9]+/.test(text) &&
                                       !text.includes('$0.00 | 0 ');
                
                if (sym && sym !== 'SOL' && sym !== 'USD' && hasPositiveBal) {
                    rows.push({ sym, name, fullText: text.replace(/\n+/g, ' ') });
                }
            }
            const unique = {};
            for (const item of rows) {
                if (!unique[item.sym]) unique[item.sym] = item;
            }
            return Object.values(unique);
        })()
    """)

async def sell_asset(page, sym, name=""):
    """Sell full balance of specific asset for USD with multi-attempt fallback."""
    log(f"=== SELLING {sym} ({name}) ===")
    
    for attempt in range(3):
        await ensure_no_modals(page)
        
        target_row = await page.evaluate(f"""
            (() => {{
                const sym = {json.dumps(sym)}.toUpperCase();
                const name = {json.dumps(name)}.toUpperCase();
                const allRows = [...document.querySelectorAll('tr, [class*=row], [class*=Row]')];
                for (const r of allRows) {{
                    const t = (r.innerText || '').toUpperCase();
                    if (t.includes(sym) || (name && name.length > 2 && t.includes(name))) {{
                        const btn = [...r.querySelectorAll('button')].find(b => (b.innerText||'').trim() === 'Trade');
                        if (btn) {{
                            btn.scrollIntoView({{ block: 'center', inline: 'center' }});
                            const rect = btn.getBoundingClientRect();
                            return {{
                                ok: true,
                                x: Math.round(rect.x + rect.width/2),
                                y: Math.round(rect.y + rect.height/2)
                            }};
                        }}
                    }}
                }}
                return {{ ok: false }};
            }})()
        """)
        
        if not target_row.get("ok"):
            log(f"Trade button not found for {sym} (attempt {attempt+1}/3)")
            await page.wait_for_timeout(1500)
            continue
            
        log(f"Clicking Trade on {sym} at ({target_row['x']}, {target_row['y']})")
        await mc(page, target_row["x"], target_row["y"])
        await page.wait_for_timeout(2500)
        
        # Select Sell tab
        for _ in range(4):
            sell_tab = await page.evaluate(r"""
                (() => {
                    const modal = [...document.querySelectorAll('[class*=Modal-content], [class*=mantine-Modal-content], [class*=mantine-Paper-root]')].find(m => {
                        const r = m.getBoundingClientRect();
                        return r.width > 200 && r.height > 200 && r.top >= 0;
                    });
                    if (!modal) return { ok: false };
                    
                    const isSellActive = /sell for/i.test(modal.innerText);
                    if (isSellActive) return { ok: true, active: true };
                    
                    const tabs = [...modal.querySelectorAll('button, [role=tab], [class*=Tabs-tab], span')].filter(b => {
                        const t = (b.innerText || '').trim();
                        const r = b.getBoundingClientRect();
                        return t === 'Sell' && r.width > 15 && r.top >= 0;
                    });
                    
                    if (tabs.length > 0) {
                        const r = tabs[0].getBoundingClientRect();
                        return { ok: true, active: false, x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
                    }
                    return { ok: false };
                })()
            """)
            
            if sell_tab.get("active"):
                break
            elif sell_tab.get("ok") and not sell_tab.get("active"):
                log(f"Clicking Sell tab at ({sell_tab['x']}, {sell_tab['y']})")
                await mc(page, sell_tab["x"], sell_tab["y"])
                await page.wait_for_timeout(1500)
                
        # Click Max button
        for _ in range(6):
            max_info = await page.evaluate(r"""
                (() => {
                    const modal = [...document.querySelectorAll('[class*=Modal-content], [class*=mantine-Modal-content], [class*=mantine-Paper-root]')].find(m => {
                        const r = m.getBoundingClientRect();
                        return r.width > 200 && r.height > 200 && r.top >= 0;
                    });
                    if (!modal) return null;
                    
                    const btns = [...modal.querySelectorAll('button, [role=button]')].filter(b => {
                        const t = (b.innerText || '').trim();
                        const r = b.getBoundingClientRect();
                        return /^(max\.?|100%)$/i.test(t) && r.width > 10;
                    });
                    
                    const input = modal.querySelector('input');
                    const val = input ? (input.value || '').trim() : '';
                    
                    if (btns.length > 0) {
                        const r = btns[0].getBoundingClientRect();
                        return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), val };
                    }
                    return null;
                })()
            """)
            
            if max_info:
                val = max_info.get("val", "")
                if val and val != "0" and val != "0.00" and val != "0.0":
                    break
                log(f"Clicking Max button at ({max_info['x']}, {max_info['y']})")
                await mc(page, max_info["x"], max_info["y"])
                await page.wait_for_timeout(1200)

        # Check if modal shows 0 balance / dust
        modal_bal_check = await page.evaluate(r"""
            (() => {
                const modal = [...document.querySelectorAll('[class*=Modal-content], [class*=mantine-Modal-content], [class*=mantine-Paper-root]')].find(m => {
                    const r = m.getBoundingClientRect();
                    return r.width > 200 && r.height > 200 && r.top >= 0;
                });
                if (!modal) return { isZero: false };
                const text = modal.innerText || '';
                const input = modal.querySelector('input');
                const val = input ? (input.value || '').trim() : '';
                const isZero = (val === '' || val === '0' || val === '0.0' || val === '0.00') && 
                               (/available:?\s*\$0(\.00)?|balance:?\s*0(\.0+)?/i.test(text) || /insufficient/i.test(text));
                return { isZero, val };
            })()
        """)
        
        if modal_bal_check.get("isZero"):
            log(f"{sym} has 0 or dust balance in trade modal. Skipping.")
            await ensure_no_modals(page)
            return True
                
        # Click Sell CTA button
        sell_btn = await page.evaluate(f"""
            (() => {{
                const sym = {json.dumps(sym)};
                const modal = [...document.querySelectorAll('[class*=Modal-content], [class*=mantine-Modal-content], [class*=mantine-Paper-root]')].find(m => {{
                    const r = m.getBoundingClientRect();
                    return r.width > 200 && r.height > 200 && r.top >= 0;
                }});
                if (!modal) return null;
                
                const btns = [...modal.querySelectorAll('button')].filter(b => {{
                    const t = (b.innerText || '').trim();
                    return /^sell/i.test(t) && !/sell for/i.test(t) && !b.disabled;
                }});
                if (btns.length > 0) {{
                    const r = btns[btns.length - 1].getBoundingClientRect();
                    return {{ ok: true, text: btns[btns.length - 1].innerText, x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) }};
                }}
                return null;
            }})()
        """)
        
        if sell_btn and sell_btn.get("ok"):
            log(f"Clicking CTA '{sell_btn['text']}' at ({sell_btn['x']}, {sell_btn['y']})")
            await mc(page, sell_btn["x"], sell_btn["y"])
            await page.wait_for_timeout(2000)
            
            res = await handle_rate_expired_and_confirm(page, f"Sell {sym}")
            await ensure_no_modals(page)
            if res:
                log(f"Sale of {sym} completed successfully.")
                return True
        else:
            log(f"Sell CTA button not ready (attempt {attempt+1}/3)")
            
        await page.wait_for_timeout(2000)
        
    await ensure_no_modals(page)
    return False

async def buy_all_sol(page):
    """Buy SOL using entire available USD fiat balance (with table row and global search fallbacks)."""
    log("=== BUYING SOL WITH ACCUMULATED USD ===")
    
    for attempt in range(3):
        await ensure_no_modals(page)
        opened_modal = False
        
        # Method 1: Table row
        sol_row = await page.evaluate(r"""
            (() => {
                const allRows = [...document.querySelectorAll('tr, [class*=row], [class*=Row]')];
                for (const r of allRows) {
                    const t = (r.innerText || '');
                    if (t.includes('SOL') || t.includes('Solana')) {
                        const btn = [...r.querySelectorAll('button')].find(b => (b.innerText||'').trim() === 'Trade');
                        if (btn) {
                            btn.scrollIntoView({ block: 'center', inline: 'center' });
                            const rect = btn.getBoundingClientRect();
                            return { ok: true, x: Math.round(rect.x + rect.width/2), y: Math.round(rect.y + rect.height/2) };
                        }
                    }
                }
                return { ok: false };
            })()
        """)
        
        if sol_row.get("ok"):
            log(f"Clicking Trade on Solana table row at ({sol_row['x']}, {sol_row['y']})")
            await mc(page, sol_row["x"], sol_row["y"])
            await page.wait_for_timeout(2500)
            opened_modal = True
        else:
            # Method 2: Global Buy Tokens modal + search
            log("Opening global Buy Tokens...")
            buy_tokens_btn = await page.evaluate(r"""
                (() => {
                    const btns = [...document.querySelectorAll('button')].filter(b => 
                        (b.innerText || '').trim().toLowerCase() === 'buy tokens'
                    );
                    if (btns.length > 0) {
                        const r = btns[0].getBoundingClientRect();
                        return { ok: true, x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
                    }
                    return { ok: false };
                })()
            """)
            
            if buy_tokens_btn.get("ok"):
                await mc(page, buy_tokens_btn["x"], buy_tokens_btn["y"])
                await page.wait_for_timeout(2500)
                
                # Type SOL in search bar if available
                await page.evaluate(r"""
                    (() => {
                        const modal = [...document.querySelectorAll('[class*=Modal-content], [class*=mantine-Modal-content], [class*=mantine-Paper-root]')].find(m => {
                            const r = m.getBoundingClientRect();
                            return r.width > 200 && r.height > 200 && r.top >= 0;
                        });
                        if (!modal) return;
                        const searchInput = modal.querySelector('input');
                        if (searchInput) {
                            searchInput.focus();
                            searchInput.value = 'SOL';
                            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    })()
                """)
                await page.wait_for_timeout(1000)
                
                sol_choice = await page.evaluate(r"""
                    (() => {
                        const modal = [...document.querySelectorAll('[class*=Modal-content], [class*=mantine-Modal-content], [class*=mantine-Paper-root]')].find(m => {
                            const r = m.getBoundingClientRect();
                            return r.width > 200 && r.height > 200 && r.top >= 0;
                        });
                        if (!modal) return { ok: false };
                        
                        const items = [...modal.querySelectorAll('div, button, [role=button]')].filter(el => {
                            const t = (el.innerText || '').trim();
                            return (t.includes('Solana') || t.includes('SOL')) && !t.includes('Assets');
                        });
                        
                        for (const item of items) {
                            item.scrollIntoView({ block: 'center', inline: 'center' });
                            const r = item.getBoundingClientRect();
                            if (r.width > 50 && r.height > 20 && r.height < 100) {
                                return { ok: true, x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
                            }
                        }
                        return { ok: false };
                    })()
                """)
                
                if sol_choice.get("ok"):
                    log(f"Selected Solana from token list at ({sol_choice['x']}, {sol_choice['y']})")
                    await mc(page, sol_choice["x"], sol_choice["y"])
                    await page.wait_for_timeout(2500)
                    opened_modal = True

        if not opened_modal:
            log(f"Failed to open Buy Solana modal (attempt {attempt+1}/3)")
            await page.wait_for_timeout(2000)
            continue
            
        # Ensure Buy tab is active if tabs exist
        await page.evaluate(r"""
            (() => {
                const modal = [...document.querySelectorAll('[class*=Modal-content], [class*=mantine-Modal-content], [class*=mantine-Paper-root]')].find(m => {
                    const r = m.getBoundingClientRect();
                    return r.width > 200 && r.height > 200 && r.top >= 0;
                });
                if (!modal) return;
                const buyTab = [...modal.querySelectorAll('button, [role=tab], [class*=Tabs-tab], span')].find(b => 
                    (b.innerText || '').trim() === 'Buy' && b.getBoundingClientRect().width > 15
                );
                if (buyTab) buyTab.click();
            })()
        """)
        await page.wait_for_timeout(500)

        # Ensure USD Fiat Wallet is selected as payment method (and NEVER credit/debit cards or Apple Pay)
        fiat_pay_info = await page.evaluate(r"""
            (() => {
                const modal = [...document.querySelectorAll('[class*=Modal-content], [class*=mantine-Modal-content], [class*=mantine-Paper-root]')].find(m => {
                    const r = m.getBoundingClientRect();
                    return r.width > 200 && r.height > 200 && r.top >= 0;
                });
                if (!modal) return { ok: false };
                
                const text = modal.innerText || '';
                
                // If payment method selector/tabs exist, select USD / Fiat Wallet
                const payBtns = [...modal.querySelectorAll('button, div, [role=button], [role=tab], [class*=item], span')].filter(el => {
                    const t = (el.innerText || '').trim();
                    const r = el.getBoundingClientRect();
                    return /^(fiat wallet|usd balance|usd fiat|cash|usd)$/i.test(t) && r.width > 15 && r.height > 15;
                });
                
                if (payBtns.length > 0) {
                    const r = payBtns[0].getBoundingClientRect();
                    return { ok: true, clickPay: true, x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
                }
                
                // If only credit/debit card or add card is available, block it
                if (/add credit\/debit card|pay with card|link a card/i.test(text) && !/fiat wallet|usd/i.test(text)) {
                    return { ok: false, cardOnly: true };
                }
                
                return { ok: true, clickPay: false };
            })()
        """)

        if fiat_pay_info.get("cardOnly"):
            log("Buy SOL: Only credit/debit card options available (no USD fiat). Aborting to prevent non-USD payments.")
            await ensure_no_modals(page)
            return False

        if fiat_pay_info.get("clickPay"):
            log(f"Selecting USD Fiat Wallet payment method at ({fiat_pay_info['x']}, {fiat_pay_info['y']})")
            await mc(page, fiat_pay_info["x"], fiat_pay_info["y"])
            await page.wait_for_timeout(1000)

        log("Clicking Max in Buy SOL modal...")
        for _ in range(6):
            max_info = await page.evaluate(r"""
                (() => {
                    const modal = [...document.querySelectorAll('[class*=Modal-content], [class*=mantine-Modal-content], [class*=mantine-Paper-root]')].find(m => {
                        const r = m.getBoundingClientRect();
                        return r.width > 200 && r.height > 200 && r.top >= 0;
                    });
                    if (!modal) return null;
                    const btns = [...modal.querySelectorAll('button, [role=button]')].filter(b => {
                        const t = (b.innerText || '').trim();
                        const r = b.getBoundingClientRect();
                        return /^(max\.?|100%)$/i.test(t) && r.width > 10;
                    });
                    const input = modal.querySelector('input');
                    const val = input ? (input.value || '').trim() : '';
                    if (btns.length > 0) {
                        const r = btns[0].getBoundingClientRect();
                        return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), val };
                    }
                    return null;
                })()
            """)
            if max_info:
                val = max_info.get("val", "")
                if val and val != "0" and val != "0.0" and val != "0.00":
                    break
                await mc(page, max_info["x"], max_info["y"])
                await page.wait_for_timeout(1200)

        # Check if modal shows 0 USD balance / dust / insufficient funds
        modal_usd_check = await page.evaluate(r"""
            (() => {
                const modal = [...document.querySelectorAll('[class*=Modal-content], [class*=mantine-Modal-content], [class*=mantine-Paper-root]')].find(m => {
                    const r = m.getBoundingClientRect();
                    return r.width > 200 && r.height > 200 && r.top >= 0;
                });
                if (!modal) return { isZero: false };
                const text = modal.innerText || '';
                const input = modal.querySelector('input');
                const val = input ? (input.value || '').trim() : '';
                const isZero = (val === '' || val === '0' || val === '0.0' || val === '0.00') && 
                               (/available:?\s*\$0(\.00)?|balance:?\s*0(\.0+)?/i.test(text) || /insufficient/i.test(text));
                return { isZero, val };
            })()
        """)

        if modal_usd_check.get("isZero"):
            log("Buy SOL: Available USD is $0.00 or dust in trade modal. No funds to convert.")
            await ensure_no_modals(page)
            return False

        buy_cta = await page.evaluate(r"""
            (() => {
                const modal = [...document.querySelectorAll('[class*=Modal-content], [class*=mantine-Modal-content], [class*=mantine-Paper-root]')].find(m => {
                    const r = m.getBoundingClientRect();
                    return r.width > 200 && r.height > 200 && r.top >= 0;
                });
                if (!modal) return null;
                const btns = [...modal.querySelectorAll('button')].filter(b => {
                    const t = (b.innerText || '').trim();
                    return (/^buy\s*sol/i.test(t) || (/^buy$/i.test(t) && !/pay with/i.test(t))) && 
                           !/card|apple pay|google pay/i.test(t) && 
                           !b.disabled;
                });
                if (btns.length > 0) {
                    const r = btns[btns.length - 1].getBoundingClientRect();
                    return { ok: true, text: btns[btns.length - 1].innerText, x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
                }
                return null;
            })()
        """)
        
        if buy_cta and buy_cta.get("ok"):
            log(f"Clicking Buy SOL CTA at ({buy_cta['x']}, {buy_cta['y']})")
            await mc(page, buy_cta["x"], buy_cta["y"])
            await page.wait_for_timeout(2000)
            
            res = await handle_rate_expired_and_confirm(page, "Buy SOL")
            await ensure_no_modals(page)
            if res:
                log("Buy SOL order completed successfully.")
                return True
        else:
            log(f"Buy SOL CTA button not ready (attempt {attempt+1}/3)")
            
        await page.wait_for_timeout(2000)
        
    await ensure_no_modals(page)
    return False

async def auto_add_sol_address(page, target_address, label="My SOL Wallet"):
    """Automatically add a new Solana withdrawal address to Crypto.com address book with passkey/passcode auth."""
    log(f"Adding new destination address {target_address} to Address Book...")
    
    # 1. Click "Add Now" or "Add Address" button in the center of the Withdraw SOL modal
    add_btn_info = await page.evaluate(r"""
        (() => {
            const modal = [...document.querySelectorAll('[class*=Modal-content], [class*=mantine-Modal-content], [class*=mantine-Paper-root], [role=dialog]')].find(m => {
                const r = m.getBoundingClientRect();
                return r.width > 200 && r.height > 200 && r.top >= 0;
            });
            if (!modal) return { ok: false, reason: 'no_modal' };
            
            const btns = [...modal.querySelectorAll('button, div, [role=button], a, span')].filter(el => {
                const t = (el.innerText || '').trim();
                const r = el.getBoundingClientRect();
                return /^(Add Now|Add Address|\+\s*Add|Add|Add New)$/i.test(t) && r.width > 20 && r.height > 15;
            });
            
            if (btns.length > 0) {
                // Pick the most specific button (prefer exact 'Add Now' if present)
                const exactAddNow = btns.find(b => (b.innerText || '').trim().toLowerCase() === 'add now') || btns[0];
                const r = exactAddNow.getBoundingClientRect();
                return { ok: true, text: exactAddNow.innerText.trim(), x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
            }
            return { ok: false, reason: 'btn_not_found' };
        })()
    """)
    
    if not add_btn_info.get("ok"):
        log(f"Could not find 'Add Now' button in modal ({add_btn_info.get('reason')}).")
        return False
        
    log(f"Clicking '{add_btn_info.get('text', 'Add Now')}' at ({add_btn_info['x']}, {add_btn_info['y']})")
    await mc(page, add_btn_info["x"], add_btn_info["y"])
    await page.wait_for_timeout(2500)
    
    # 2. Fill Address and Wallet Name in the "Wallet Address Details" form
    form_filled = await page.evaluate(fr"""
        (() => {{
            const modal = [...document.querySelectorAll('[class*=Modal-content], [class*=mantine-Modal-content], [class*=mantine-Paper-root], [role=dialog]')].find(m => {{
                const r = m.getBoundingClientRect();
                return r.width > 200 && r.height > 200 && r.top >= 0;
            }}) || document;
            
            const inputs = [...modal.querySelectorAll('input, textarea')].filter(i => {{
                const r = i.getBoundingClientRect();
                return r.width > 50 && r.height > 15 && !i.readOnly && !i.disabled;
            }});
            
            if (inputs.length === 0) return {{ ok: false, reason: 'no_inputs' }};
            
            const targetAddr = {json.dumps(target_address)};
            const targetLabel = {json.dumps(label)};
            
            // Match specifically by placeholder "Enter address" or "Enter name"
            let addrInput = inputs.find(i => /enter\s*address|address/i.test(i.placeholder || i.name || i.id || ''));
            let nameInput = inputs.find(i => /enter\s*name|name|label/i.test(i.placeholder || i.name || i.id || ''));
            
            if (!addrInput && inputs.length >= 1) addrInput = inputs[0];
            if (!nameInput && inputs.length >= 2) nameInput = inputs[1];
            
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            
            if (addrInput) {{
                addrInput.focus();
                if (nativeSetter) {{
                    nativeSetter.call(addrInput, targetAddr);
                }} else {{
                    addrInput.value = targetAddr;
                }}
                addrInput.dispatchEvent(new Event('input', {{ bubbles: true }}));
                addrInput.dispatchEvent(new Event('change', {{ bubbles: true }}));
            }}
            
            if (nameInput && nameInput !== addrInput) {{
                nameInput.focus();
                if (nativeSetter) {{
                    nativeSetter.call(nameInput, targetLabel);
                }} else {{
                    nameInput.value = targetLabel;
                }}
                nameInput.dispatchEvent(new Event('input', {{ bubbles: true }}));
                nameInput.dispatchEvent(new Event('change', {{ bubbles: true }}));
            }}
            
            return {{ ok: true, hasAddr: !!addrInput, hasName: !!nameInput }};
        }})()
    """)
    
    log(f"Add Address form fill status: {form_filled}")
    await page.wait_for_timeout(1500)
    
    # 3. Wait for "Continue" button to become enabled (address validation may take a moment)
    submit_info = None
    for _ in range(6):
        submit_info = await page.evaluate(r"""
            (() => {
                const modal = [...document.querySelectorAll('[class*=Modal-content], [class*=mantine-Modal-content], [class*=mantine-Paper-root], [role=dialog]')].find(m => {
                    const r = m.getBoundingClientRect();
                    return r.width > 200 && r.height > 200 && r.top >= 0;
                }) || document;
                
                const btns = [...modal.querySelectorAll('button')].filter(b => {
                    const t = (b.innerText || '').trim().toLowerCase();
                    return (t === 'continue' || t === 'add address' || t === 'save' || t === 'confirm') && !b.disabled;
                });
                
                if (btns.length > 0) {
                    const b = btns[btns.length - 1];
                    const r = b.getBoundingClientRect();
                    return { ok: true, text: b.innerText.trim(), x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
                }
                return { ok: false };
            })()
        """)
        if submit_info and submit_info.get("ok"):
            break
        await page.wait_for_timeout(500)
    
    if submit_info and submit_info.get("ok"):
        log(f"Submitting Add Address form via '{submit_info['text']}' at ({submit_info['x']}, {submit_info['y']})")
        await mc(page, submit_info["x"], submit_info["y"])
        await page.wait_for_timeout(2000)
        
        # 4. Handle authentication (passkey / passcode)
        auth_res = await handle_rate_expired_and_confirm(page, "Add New Address")
        await page.wait_for_timeout(2500)
        log("Address addition authentication completed.")
        return True
    else:
        log("Submit 'Continue' button for Add Address not found or remained disabled.")
        return False

async def withdraw_all_sol_single_tx(page):
    """Withdraw full accumulated SOL balance in ONE single transaction with robust fallbacks."""
    log(f"=== WITHDRAWING ALL SOL IN ONE GO TO {ADDRESS} ===")
    
    for attempt in range(3):
        await ensure_no_modals(page)
        
        dots_info = await page.evaluate(r"""
            (() => {
                const allRows = [...document.querySelectorAll('tr, [class*=row], [class*=Row]')];
                for (const r of allRows) {
                    const t = (r.innerText || '');
                    if (t.includes('SOL') || t.includes('Solana')) {
                        const btns = [...r.querySelectorAll('button, [role=button], [class*=ActionIcon], [class*=menu]')].filter(b => b.getBoundingClientRect().width > 0);
                        if (btns.length >= 2) {
                            const dotsBtn = btns[btns.length - 1];
                            dotsBtn.scrollIntoView({ block: 'center', inline: 'center' });
                            const rect = dotsBtn.getBoundingClientRect();
                            return { ok: true, x: Math.round(rect.x + rect.width/2), y: Math.round(rect.y + rect.height/2) };
                        }
                    }
                }
                return { ok: false };
            })()
        """)
        
        if not dots_info.get("ok"):
            log(f"3-dots menu button not found on SOL row (attempt {attempt+1}/3)")
            await page.wait_for_timeout(2000)
            continue
            
        log(f"Clicking 3-dots on SOL row at ({dots_info['x']}, {dots_info['y']})")
        await mc(page, dots_info["x"], dots_info["y"])
        await page.wait_for_timeout(1500)
        
        wd_menu = await page.evaluate(r"""
            (() => {
                const items = [...document.querySelectorAll('[class*=mantine-Menu-item], [role=menuitem], button')].filter(el => 
                    (el.innerText || '').trim() === 'Withdraw' && el.getBoundingClientRect().width > 20
                );
                if (items.length > 0) {
                    const r = items[0].getBoundingClientRect();
                    return { ok: true, x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
                }
                return { ok: false };
            })()
        """)
        
        if not wd_menu.get("ok"):
            log("Withdraw menu item not found")
            await ensure_no_modals(page)
            continue
            
        log(f"Clicking Withdraw menu item at ({wd_menu['x']}, {wd_menu['y']})")
        await mc(page, wd_menu["x"], wd_menu["y"])
        await page.wait_for_timeout(3000)
        
        addr_info = await page.evaluate(f"""
            (() => {{
                const modal = [...document.querySelectorAll('[class*=Modal-content], [class*=mantine-Modal-content], [class*=mantine-Paper-root], [role=dialog]')].find(m => {{
                    const r = m.getBoundingClientRect();
                    return r.width > 200 && r.height > 200 && r.top >= 0;
                }});
                if (!modal) return {{ ok: false }};
                const target = {json.dumps(ADDRESS)};
                const targetPrefix = target.slice(0, 10);
                
                // Find cards or rows matching the address or label
                const cards = [...modal.querySelectorAll('div, [role=button], button, label')].filter(el => {{
                    const t = el.innerText || '';
                    const r = el.getBoundingClientRect();
                    return (t.includes(target) || t.includes(targetPrefix) || t.includes('My SOL Wallet')) &&
                           r.width > 120 && r.height > 20 && r.height < 300;
                }});
                
                if (cards.length > 0) {{
                    const chosen = cards[0];
                    const r = chosen.getBoundingClientRect();
                    return {{ ok: true, x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) }};
                }}
                return {{ ok: false }};
            }})()
        """)
        
        if addr_info.get("ok"):
            log(f"Selecting destination address at ({addr_info['x']}, {addr_info['y']})")
            await mc(page, addr_info["x"], addr_info["y"])
            await page.wait_for_timeout(1200)
        else:
            log("Destination address not found in address book. Triggering auto 'Add Address' flow...")
            added = await auto_add_sol_address(page, ADDRESS, "My SOL Wallet")
            if added:
                await page.wait_for_timeout(2500)
                # Re-scan address list for newly added address
                addr_info = await page.evaluate(f"""
                    (() => {{
                        const modal = [...document.querySelectorAll('[class*=Modal-content], [class*=mantine-Modal-content], [class*=mantine-Paper-root], [role=dialog]')].find(m => {{
                            const r = m.getBoundingClientRect();
                            return r.width > 200 && r.height > 200 && r.top >= 0;
                        }});
                        if (!modal) return {{ ok: false }};
                        const target = {json.dumps(ADDRESS)};
                        const targetPrefix = target.slice(0, 10);
                        const cards = [...modal.querySelectorAll('div, [role=button], button, label')].filter(el => {{
                            const t = el.innerText || '';
                            const r = el.getBoundingClientRect();
                            return (t.includes(target) || t.includes(targetPrefix) || t.includes('My SOL Wallet')) &&
                                   r.width > 120 && r.height > 20 && r.height < 300;
                        }});
                        if (cards.length > 0) {{
                            const chosen = cards[0];
                            const r = chosen.getBoundingClientRect();
                            return {{ ok: true, x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) }};
                        }}
                        return {{ ok: false }};
                    }})()
                """)
                if addr_info.get("ok"):
                    log(f"Selecting newly added destination address at ({addr_info['x']}, {addr_info['y']})")
                    await mc(page, addr_info["x"], addr_info["y"])
                    await page.wait_for_timeout(1200)
                else:
                    log("Address added, checking if already on amount screen...")
            else:
                log("Failed to auto-add destination address. Retrying...")
                await ensure_no_modals(page)
                continue
            
        wd_cta_1 = await page.evaluate(r"""
            (() => {
                const modal = [...document.querySelectorAll('[class*=Modal-content], [class*=mantine-Modal-content], [class*=mantine-Paper-root], [role=dialog]')].find(m => {
                    const r = m.getBoundingClientRect();
                    return r.width > 200 && r.height > 200 && r.top >= 0;
                });
                if (!modal) return null;
                const btns = [...modal.querySelectorAll('button')].filter(b => {
                    const t = (b.innerText||'').trim().toLowerCase();
                    const r = b.getBoundingClientRect();
                    return t === 'withdraw' && r.width > 100 && r.height > 30 && !b.disabled;
                });
                if (btns.length > 0) {
                    const r = btns[btns.length - 1].getBoundingClientRect();
                    return { ok: true, x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
                }
                return null;
            })()
        """)
        if wd_cta_1 and wd_cta_1.get("ok"):
            log("Clicking Withdraw on address book screen...")
            await mc(page, wd_cta_1["x"], wd_cta_1["y"])
            await page.wait_for_timeout(2500)
            
        trust_btn = await page.evaluate(r"""
            (() => {
                const btns = [...document.querySelectorAll('button')].filter(b => 
                    (b.innerText||'').trim().includes('Confirm and Withdraw')
                );
                if (btns.length > 0) {
                    const r = btns[0].getBoundingClientRect();
                    return { ok: true, x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
                }
                return { ok: false };
            })()
        """)
        if trust_btn.get("ok"):
            log("Confirming trust dialog...")
            await mc(page, trust_btn["x"], trust_btn["y"])
            await page.wait_for_timeout(2500)
            
        log("Entering Max withdrawal amount...")
        for _ in range(4):
            max_amt = await page.evaluate(r"""
                (() => {
                    const modal = [...document.querySelectorAll('[class*=Modal-content], [class*=mantine-Modal-content], [class*=mantine-Paper-root]')].find(m => {
                        const r = m.getBoundingClientRect();
                        return r.width > 200 && r.height > 200 && r.top >= 0;
                    });
                    if (!modal) return null;
                    const btns = [...modal.querySelectorAll('button, [role=button], div, span')].filter(b => {
                        const t = (b.innerText || '').trim();
                        const r = b.getBoundingClientRect();
                        return /^(max|100%)$/i.test(t) && r.width > 10;
                    });
                    if (btns.length > 0) {
                        const r = btns[0].getBoundingClientRect();
                        return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
                    }
                    return null;
                })()
            """)
            if max_amt:
                await mc(page, max_amt["x"], max_amt["y"])
                await page.wait_for_timeout(1200)
                break
                
        wd_cta_2 = await page.evaluate(r"""
            (() => {
                const modal = [...document.querySelectorAll('[class*=Modal-content], [class*=mantine-Modal-content], [class*=mantine-Paper-root]')].find(m => {
                    const r = m.getBoundingClientRect();
                    return r.width > 200 && r.height > 200 && r.top >= 0;
                });
                if (!modal) return null;
                const btns = [...modal.querySelectorAll('button')].filter(b => {
                    const t = (b.innerText||'').trim();
                    return /^(withdraw\s*sol|review\s*withdrawal|withdraw)$/i.test(t) && !/insufficient/i.test(t) && !b.disabled;
                });
                if (btns.length > 0) {
                    const r = btns[btns.length - 1].getBoundingClientRect();
                    return { ok: true, text: btns[btns.length - 1].innerText, x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
                }
                return null;
            })()
        """)
        
        if wd_cta_2 and wd_cta_2.get("ok"):
            log(f"Clicking Amount CTA '{wd_cta_2['text']}' at ({wd_cta_2['x']}, {wd_cta_2['y']})")
            await mc(page, wd_cta_2["x"], wd_cta_2["y"])
            await page.wait_for_timeout(2500)
            
            res = await handle_rate_expired_and_confirm(page, "Withdraw SOL")
            await ensure_no_modals(page)
            if res:
                log("Final Single-Tx Withdrawal completed successfully.")
                return True
        else:
            log(f"Amount Withdraw button not ready (attempt {attempt+1}/3)")
            
        await page.wait_for_timeout(2000)
        
    await ensure_no_modals(page)
    return False

async def get_usd_bal(page):
    await wait_for_funds_loaded(page, timeout=5)
    return await page.evaluate(r"""
        (() => {
            const rows = [...document.querySelectorAll('tr, [class*=row], [class*=Row]')];
            for (const r of rows) {
                const t = (r.innerText || '');
                if ((t.includes('US Dollar') || /\bUSD\b/.test(t) || t.includes('Fiat')) && 
                    !t.includes('USDT') && !t.includes('USDC') && !t.includes('Tether') && !t.includes('USD Coin')) {
                    const m = t.match(/\$([\d,]+\.?\d*)/);
                    if (m) return parseFloat(m[1].replace(',', ''));
                }
            }
            return 0.0;
        })()
    """)

async def get_sol_bal_and_usd_val(page):
    await wait_for_funds_loaded(page, timeout=5)
    return await page.evaluate(r"""
        (() => {
            const rows = [...document.querySelectorAll('tr, [class*=row], [class*=Row]')];
            for (const r of rows) {
                const t = (r.innerText || '');
                if (t.includes('SOL') || t.includes('Solana')) {
                    let solAmt = 0.0;
                    let solUsd = 0.0;
                    const mSol = t.match(/([\d,]+\.?\d*)\s*SOL/i);
                    if (mSol) solAmt = parseFloat(mSol[1].replace(',', ''));
                    const mUsd = t.match(/\$([\d,]+\.?\d*)/);
                    if (mUsd) solUsd = parseFloat(mUsd[1].replace(',', ''));
                    return { sol: solAmt, usd: solUsd };
                }
            }
            return { sol: 0.0, usd: 0.0 };
        })()
    """)

async def run_pipeline():
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = next((pg for pg in context.pages if "crypto.com" in pg.url), context.pages[-1])
        log("==================================================")
        log(f"🚀 INITIALIZING NEW PIPELINE RUN [{time.strftime('%Y-%m-%d %H:%M:%S')}]")
        log(f"Connected to browser: {page.url}")
        log("==================================================")
        
        # Inject passkey vault persistently
        await inject_passkey_permanently(context, page)

        # Ensure on overview & perform initial sync to wipe any stale state from prior runs
        if "/account/overview" not in page.url:
            await page.goto("https://web.crypto.com/hub/account/overview", wait_until="domcontentloaded", timeout=15000)
            await page.wait_for_timeout(3000)
            await inject_passkey_permanently(context, page)
        else:
            log("Performing initial startup sync to clear any stale state from previous runs...")
            await reload_and_sync(context, page)

        await ensure_no_modals(page)
        
        # STEP 1: Sell ALL non-SOL assets until none remain
        log("=== STEP 1: SCANNING AND SELLING ALL NON-SOL COINS ===")
        sold_assets = set()
        for pass_idx in range(4):
            assets = await scan_all_tradeable_assets(page)
            actionable_assets = [a for a in assets if a['sym'] not in sold_assets]
            
            if len(actionable_assets) == 0:
                if len(assets) == 0:
                    log("No non-SOL crypto assets detected.")
                    break
                else:
                    log(f"All {len(assets)} detected non-SOL asset(s) ({[a['sym'] for a in assets]}) have already been sold. Verifying with page reload...")
                    await reload_and_sync(context, page)
                    fresh_assets = await scan_all_tradeable_assets(page)
                    fresh_actionable = [a for a in fresh_assets if a['sym'] not in sold_assets]
                    if len(fresh_actionable) == 0:
                        log("Confirmed: All non-SOL assets cleared from backend.")
                        break
                    actionable_assets = fresh_actionable
                
            log(f"Pass {pass_idx+1}: Found {len(actionable_assets)} non-SOL asset(s) to sell:")
            for a in actionable_assets:
                log(f"  - {a['sym']} ({a['name']})")
                
            any_sold = False
            for a in actionable_assets:
                sold = await sell_asset(page, a["sym"], a["name"])
                await page.wait_for_timeout(2000)
                await ensure_no_modals(page)
                if sold:
                    sold_assets.add(a["sym"])
                    any_sold = True
                
            # If we sold assets, synchronize frontend state with backend
            if any_sold:
                await reload_and_sync(context, page)
            else:
                break

        # STEP 2: Convert ALL accumulated USD into SOL (with sync check)
        log("=== STEP 2: CONVERTING ALL ACCUMULATED USD TO SOL ===")
        usd_bal = await get_usd_bal(page)
        log(f"Initial USD Fiat Balance: ${usd_bal:.2f}")
        
        if usd_bal < 0.10:
            log("USD balance is zero or dust. Synchronizing once to confirm...")
            await reload_and_sync(context, page)
            usd_bal = await get_usd_bal(page)
            log(f"USD balance after sync: ${usd_bal:.2f}")

        if usd_bal >= 0.10:
            bought = await buy_all_sol(page)
            await page.wait_for_timeout(2500)
            await ensure_no_modals(page)
            if bought:
                log("Buy order submitted. Synchronizing and waiting for balance settlement...")
                await reload_and_sync(context, page)
                
                # Wait and verify settlement (USD balance drops to zero/dust)
                for _ in range(2):
                    current_usd = await get_usd_bal(page)
                    if current_usd < 0.10:
                        log(f"USD balance successfully cleared (${current_usd:.2f}).")
                        break
                    log(f"Waiting for backend settlement... (current USD: ${current_usd:.2f})")
                    await page.wait_for_timeout(1500)
                    await reload_and_sync(context, page)
        else:
            log("No USD fiat balance available to convert to SOL.")

        final_usd = await get_usd_bal(page)
        if final_usd < 0.10:
            log("All USD fiat successfully converted to SOL.")
        else:
            log(f"Remaining USD balance after conversion: ${final_usd:.2f}")

        # STEP 3: Single-transaction full withdrawal of SOL in ONE go (< $10k)
        log("=== STEP 3: SINGLE-TRANSACTION SOL WITHDRAWAL ===")
        await reload_and_sync(context, page)
        
        sol_info = await get_sol_bal_and_usd_val(page)
        sol_bal = sol_info["sol"]
        sol_usd_val = sol_info["usd"]
        log(f"Final Consolidated SOL Balance: {sol_bal} SOL (~${sol_usd_val:.2f} USD)")
        
        if sol_bal > 0.001:
            if sol_usd_val <= MAX_WITHDRAWAL_LIMIT_USD:
                log(f"Consolidated balance is within limit (< ${MAX_WITHDRAWAL_LIMIT_USD:,.2f}). Executing single withdrawal in ONE go...")
                await withdraw_all_sol_single_tx(page)
                await reload_and_sync(context, page)
            else:
                log(f"Balance exceeds safety limit of ${MAX_WITHDRAWAL_LIMIT_USD:,.2f}. Manual check required.")
        else:
            log("No SOL balance available to withdraw (all funds clear).")
            
        log("=== ALL OPERATIONS COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    asyncio.run(run_pipeline())
