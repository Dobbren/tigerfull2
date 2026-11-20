'use client'
import { createElement, useState } from 'react'
import Script from 'next/script'
import { Film } from 'lucide-react'
const id='6afd5e454249ba0dec32b17e'
export default function Player(){const [error,setError]=useState(false);return <><div className="screen" role="region" aria-label="Leitor da gravação">{createElement('vturb-smartplayer',{id:`vid-${id}`,style:{display:'block',width:'100%',margin:'0 auto'}},<div className="vturb-player-placeholder" style={{position:'relative',width:'100%',padding:'56.25% 0 0',zIndex:0,backgroundColor:'black'}}/>)}<span className="record"><Film size={13}/> Gravação</span>{error&&<p className="failure">Não foi possível carregar o vídeo. <button onClick={()=>location.reload()}>Tentar novamente</button></p>}</div><Script src={`https://scripts.converteai.net/559cae8c-319d-4eeb-9ade-f4e8f12c1e74/players/${id}/v4/player.js`} onError={()=>setError(true)}/></>}
