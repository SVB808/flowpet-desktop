import type { Dashboard, FocusLabel, MascotId, MascotPersonality, PetState } from './types';
export interface MascotDefinition { id:MascotId; name:string; tagline:string; focusObject:string; cssClass:string; }
export const MASCOTS:MascotDefinition[] = [
{id:'otter',name:'Otter',tagline:'Playful and steady',focusObject:'pebble',cssClass:'otter'},
{id:'fennec',name:'Fennec fox',tagline:'Alert and curious',focusObject:'tiny notebook',cssClass:'fennec'},
{id:'raccoon',name:'Raccoon',tagline:'Mischievous but loyal',focusObject:'shiny token',cssClass:'raccoon'},
{id:'red_panda',name:'Red panda',tagline:'Cozy and determined',focusObject:'leaf bookmark',cssClass:'red-panda'},
{id:'penguin',name:'Penguin',tagline:'Calm and persistent',focusObject:'little checklist',cssClass:'penguin'},
{id:'capybara',name:'Capybara',tagline:'Unbothered and kind',focusObject:'sprig of grass',cssClass:'capybara'}];
export const PERSONALITIES:{id:MascotPersonality;name:string;description:string}[]=[
{id:'gentle',name:'Gentle',description:'Warm, low-pressure reminders.'},{id:'playful',name:'Playful',description:'Light jokes, never shaming.'},{id:'quiet',name:'Quiet',description:'Short, minimal nudges.'},{id:'coach',name:'Coach',description:'Clear prompts back to intent.'},{id:'chaotic',name:'Chaotic',description:'Supportive gremlin energy.'}];
export const mascotById=(id:MascotId)=>MASCOTS.find(m=>m.id===id)??MASCOTS[0];
export function petStateFromLabel(label:FocusLabel):PetState { return label==='focus'?'focused':label==='drift'?'drifting':label==='neutral'?'neutral':'idle'; }
export function derivePetState(d:Dashboard):PetState { if(d.tracking_paused)return 'sleeping'; if(d.break_until&&d.break_until>d.now_ts)return 'break'; if(!d.current_process)return 'idle'; if(d.current_label==='focus'){const s=d.segments.at(-1); return s?.label==='focus'&&d.now_ts-s.start_ts>=1500?'deep_focus':'focused';} return petStateFromLabel(d.current_label); }
export function companionStatusLine(id:MascotId,state:PetState,name:string){const m=mascotById(id);const n=name.trim()||m.name;const x:Record<PetState,string>={idle:`${n} is hanging around.`,focused:`${n} is settled in with the ${m.focusObject}.`,deep_focus:`${n} is fully absorbed. Deep focus.`,neutral:`${n} is between arcs.`,drifting:`${n} noticed the thread wandering.`,nudging:`${n} has a tiny reminder.`,recovering:`${n} found the thread again with you.`,break:`${n} is off duty too.`,celebrating:`${n} is celebrating a small win.`,sleeping:`${n} is snoozing while tracking is paused.`};return x[state];}
