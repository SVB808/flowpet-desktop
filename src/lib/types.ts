export type FocusLabel = 'focus' | 'neutral' | 'drift' | 'unknown';
export type ProviderKind = 'rules' | 'ollama' | 'openai_compatible';
export type MascotId = 'otter' | 'fennec' | 'raccoon' | 'red_panda' | 'penguin' | 'capybara';
export type MascotPersonality = 'gentle' | 'playful' | 'quiet' | 'coach' | 'chaotic';
export type PetState = 'idle' | 'focused' | 'deep_focus' | 'neutral' | 'drifting' | 'nudging' | 'recovering' | 'break' | 'celebrating' | 'sleeping';
export interface ActivitySegment { id:string; start_ts:number; end_ts:number; process_name:string; context_title:string|null; label:FocusLabel; confidence:number; category:string; reason:string; source:string; }
export interface Quest { id:string; date:string; quest_type:string; title:string; description:string; target:number; progress:number; completed:boolean; }
export interface Dashboard { now_ts:number; current_label:FocusLabel; current_process:string|null; current_title:string|null; current_reason:string|null; tracking_paused:boolean; break_until:number|null; active_intent:string|null; focus_minutes:number; neutral_minutes:number; drift_minutes:number; recovery_count:number; median_recovery_seconds:number|null; segments:ActivitySegment[]; quests:Quest[]; provider_status:string; }
export interface Settings { onboarding_complete:boolean; provider:ProviderKind; ollama_base_url:string; ollama_model:string; byo_base_url:string; byo_model:string; has_byo_api_key:boolean; capture_mode:'app_only'|'context'|'context_redacted'; nudge_enabled:boolean; pet_enabled:boolean; mascot:MascotId; mascot_personality:MascotPersonality; companion_name:string; drift_nudge_after_seconds:number; nudge_cooldown_seconds:number; }
export interface SaveSettingsInput extends Settings { byo_api_key?:string; }
export interface ProviderProbe { ok:boolean; message:string; models:string[]; }
export interface CompanionEvent { kind:'state'|'nudge'|'notice'|'clear'; label:FocusLabel; message?:string|null; nudge_id?:string|null; level?:number|null; process_name?:string|null; title?:string|null; }
