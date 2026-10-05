import{C as e,E as t,O as n,P as r,S as i,T as a,b as o,c as s,d as c,f as l,g as u,h as d,j as f,k as ee,l as p,m,p as h,r as te,t as ne,u as g,v as re,x as ie}from"./index-Bgrn0Dhp.js";import{a as ae,c as oe,i as se,n as _,o as v,s as y,t as b}from"./translationService-Blv-UGMc.js";function x({containerElement:x,mediaPlayer:S,onSongSaved:C,onGoToMenu:ce,onEnterLyricsMode:w}){let le=`saranga_editor_translation_ref_mode`,T=null,E=0,D=new Set,O=``,k=`info`,A=!0,ue=!1,de=!1,j=!1,M=!1,N=``,fe=null,P=`both`,F=null,I=!1,L=!1,R=!1,z=0,B=!1,pe=``,V=!1,H=!1,U=null,W=new Set,G=new Set;try{let e=localStorage.getItem(le);[`both`,`text`,`alt`,`none`].includes(e)&&(P=e)}catch{}function me(){return{id:null,title:``,artist:``,genres:[`Pop`],tags:[`mi-creación`],videos:[{id:`vid-${Date.now()}-0`,name:`Video Oficial (YouTube / YT Music)`,url:``,offset:0}],lyrics_data:{timing:{bpm:120,timeSignature:[4,4],syncMode:`timestamp`,globalOffset:0},styles:{textColor:`#94a3b8`,activeColor:`#fbbf24`,completedColor:`#f59e0b`,translationColor:`#38bdf8`,backgroundColor:`#0f172a`},languages:[{code:`es`,name:`Español (Original)`,isMain:!0,plain:``,lines:[]}]}}}function he(e){if(!e)return me();let t=JSON.parse(JSON.stringify(e));return t.metadata&&(!t.title&&t.metadata.title&&(t.title=t.metadata.title),!t.artist&&t.metadata.artist&&(t.artist=t.metadata.artist),(!t.videos||t.videos.length===0)&&t.metadata.videos&&(t.videos=t.metadata.videos),(!t.genres||t.genres.length===0)&&t.metadata.genres&&(t.genres=t.metadata.genres),(!t.tags||t.tags.length===0)&&t.metadata.tags&&(t.tags=t.metadata.tags),!t.audio_path&&t.metadata.audioPath&&(t.audio_path=t.metadata.audioPath)),t.lyrics_data||=t.basic||{},(!Array.isArray(t.lyrics_data.languages)||t.lyrics_data.languages.length===0)&&(t.basic&&Array.isArray(t.basic.languages)&&t.basic.languages.length>0?t.lyrics_data.languages=t.basic.languages:t.lyrics_data.languages=[{code:`es`,name:`Español (Original)`,isMain:!0,plain:t.lyrics_data.plain||``,lines:t.lyrics_data.lines||[]}]),(!Array.isArray(t.videos)||t.videos.length===0)&&(t.videos=[{id:`vid-${Date.now()}-0`,name:`Video Oficial`,url:t.metadata?.youtubeUrlFull||t.lyrics_data.youtube?.full||``,offset:0}]),t}function ge(e,t,n){if(!e||!T)return;let r=x?.querySelector(`#editor-title-input`),i=x?.querySelector(`#editor-artist-input`),a=r?r.value.trim():null,o=i?i.value.trim():null,s=he(e);a&&a!==T.title&&(s.title=a),o&&o!==T.artist&&(s.artist=o),T=s,E>=T.lyrics_data.languages.length&&(E=0),O=t||``,k=n||`info`,B=!1;let c=T.videos?.find(e=>e.url);c&&S&&S.loadSong(T,c.id).catch(()=>{}),Y(),Z()}function _e(e,t){let{loadPromise:n,sourceName:r,translateTo:i,registerProgressCallbacks:a}=e;a&&a({onProgress:e=>{t===z&&(O=e,k=`info`,Y())},onLyricsReady:e=>{t===z&&(B=!1,ge(e,i&&i!==`none`?`Letra obtenida desde ${r||`el proveedor`}. Traduciendo frases a ${i}...`:`¡Letra cargada con éxito desde ${r||`el proveedor`}!`,`info`))}}),n&&n.then(e=>{t===z&&(B=!1,ge(e,`¡Letra cargada y lista${r?` desde ${r}`:``}!`,`success`))}).catch(e=>{t===z&&(B=!1,O=`No se pudo obtener la letra${r?` desde ${r}`:``}: `+(e.message||e),k=`error`,Y())})}function ve(e=null,t={}){let n=++z;T=e?he(e):me(),B=!!t.loadPromise,pe=t.sourceName||``,E=0,D=new Set([0]),O=t.initialStatus?.message||``,k=t.initialStatus?.type||`info`,A=!T.title,ue=!1,de=!1,j=!1,M=!1,N=``,F&&=(clearTimeout(F),null),I=!1,L=!1;let r=T.videos?.find(e=>e.url);r&&typeof S?.loadSong==`function`&&S.loadSong(T,r.id).catch(()=>{}),J(),R=!0,Y(),t.loadPromise&&_e(t,n)}function K(e,t=`info`){O=e,k=t,Y()}function q(){return T?.lyrics_data?.languages?T.lyrics_data.languages[E]||T.lyrics_data.languages[0]:null}function ye(e){let t=Number(e?.startTime)||0,n=Number(e?.endTime)>t?Number(e.endTime):t+3;if(Array.isArray(e?.syllables)&&e.syllables.length>0)for(let t=0;t<e.syllables.length;t++){let r=e.syllables[t],i=(Number(r?.startTime)||0)+Math.max(.05,Number(r?.duration)||.3);i>n&&(n=i)}return{start:t,end:n}}function J(){x&&(x.querySelectorAll(`.phrase-editor-card.is-active-phrase`).forEach(e=>e.classList.remove(`is-active-phrase`)),x.querySelectorAll(`.syllable-edit-chip.is-active-syllable`).forEach(e=>e.classList.remove(`is-active-syllable`))),W=new Set,G=new Set}function be(e){if(!x||!T)return;let t=q()?.lines||[];if(t.length===0){J();return}let n=new Set;for(let r=0;r<t.length;r++){let i=t[r],{start:a,end:o}=ye(i);if(a>e+5&&r>0)break;e>=a&&e<=o&&n.add(r)}let r=new Set;for(let i of n){let n=t[i];if(Array.isArray(n?.syllables)&&n.syllables.length>0)for(let t=0;t<n.syllables.length;t++){let a=n.syllables[t],o=Number(a?.startTime)||0,s=o+Math.max(.05,Number(a?.duration)||.3);e>=o&&e<s&&r.add(`${i}-${t}`)}}for(let e of W)if(!n.has(e)){let t=x.querySelector(`.phrase-editor-card[data-line-idx="${e}"]`);t&&t.classList.remove(`is-active-phrase`)}for(let e of n)if(!W.has(e)){let t=x.querySelector(`.phrase-editor-card[data-line-idx="${e}"]`);t&&t.classList.add(`is-active-phrase`)}W=n;for(let e of G)if(!r.has(e)){let[t,n]=e.split(`-`),r=x.querySelector(`.syllable-edit-chip[data-line-idx="${t}"][data-syl-idx="${n}"]`);r&&r.classList.remove(`is-active-syllable`)}for(let e of r)if(!G.has(e)){let[t,n]=e.split(`-`),r=x.querySelector(`.syllable-edit-chip[data-line-idx="${t}"][data-syl-idx="${n}"]`);r&&r.classList.add(`is-active-syllable`)}G=r}function Y(){if(!x||!T)return;J();let r=x.querySelector(`.editor-content-scroll`),te=R?0:r?r.scrollTop:0,ne=x.querySelector(`.editor-lang-tabs-bar`),oe=R?0:ne?ne.scrollLeft:0,se=typeof window<`u`&&!R&&(window.scrollY||document.documentElement?.scrollTop)||0;R=!1;let _=q(),v=T.lyrics_data.languages||[],y=v.find(e=>e.isMain)||v[0],b=!(!_||_.isMain),C=_?.lines||[],ce=T.videos||[];T.id;let w=C.reduce((e,t)=>e+(t.syllables?.length||0),0),le=(C||[]).some(e=>ae(e.text))||_&&ae(_.plain||``),fe=v.map((e,t)=>{let n=t===E;return`
        <button
          class="editor-lang-tab ${n?`active`:``}"
          data-lang-idx="${t}"
          title="${n?`Hacé clic para cambiar nombre o código ISO de este idioma`:`Cambiar al idioma ${$(e.name)}`}"
        >
          ${e.isMain?`(Principal) `:``}${$(e.name)}
          <span class="lang-code-pill">[${$(e.code)}]</span>
          ${n?`<span class="tab-edit-icon" title="Editar nombre y código ISO">${h}</span>`:``}
        </button>
      `}).join(``),F=C.length===0?B?`
          <div class="empty-lines-state">
            <div class="translation-loading-spinner" style="margin: 1.5rem auto;"></div>
            <p class="empty-title">Descargando letra y sincronización...</p>
            <p class="empty-desc">Conectando con ${$(pe||`el proveedor`)} para obtener los versos, tiempos y sílabas.</p>
          </div>
        `:`
          <div class="empty-lines-state">
            <p class="empty-title">Este idioma aún no tiene frases añadidas.</p>
            <p class="empty-desc">${b?`Podés traducir automáticamente toda la canción desde el original con tiempos sincronizados, o añadir frases una a una.`:`Podés añadir frases una a una o pegar la letra completa con tiempos y sílabas automáticas.`}</p>
            <div class="empty-actions">
              ${b&&(y?.lines?.length||0)>0?`
                <button class="btn btn-primary btn-auto-translate-all">${a} Traducir Toda la Canción</button>
              `:``}
              <button class="btn btn-primary btn-add-first-line">${i} Añadir Primera Frase</button>
              <button class="btn btn-outline btn-open-quick-import">${d} Pegar Letra Completa</button>
            </div>
          </div>
        `:C.map((e,n)=>{let r=!b&&D.has(n),a=e.syllables?.length||0,o=Math.max(0,(e.endTime||0)-(e.startTime||0)),l=``;if(b&&P!==`none`){let e=y?.lines?.[n];if(e){let t=(e.text||``).trim(),r=(e.altText||e.romaji||``).trim(),i=P===`text`||P===`both`,a=P===`alt`||P===`both`;l=`
              <div class="phrase-ref-guide" data-line-idx="${n}" title="Referencia del idioma original (${$(y.name||`Original`)}) para el verso #${n+1}">
                <span class="phrase-ref-label">
                  ${u} ${$(y.name||`Original`)} #${n+1}:
                </span>

                ${i?`
                  <span class="phrase-ref-text ${t?``:`is-blank-pause`}" title="${t?`Texto original`:`En el original este verso está en blanco (pausa instrumental)`}">
                    ${t?$(t):`⏸ [Pausa / Verso en blanco]`}
                  </span>
                `:``}

                ${i&&a&&r&&t?`
                  <span class="phrase-ref-sep">•</span>
                `:``}

                ${a?`
                  ${r?`
                    <span class="phrase-ref-alt" title="Texto alternativo fonético">${$(r)}</span>
                  `:P===`alt`?`
                    <span class="phrase-ref-alt is-blank-alt" title="Sin texto alternativo">(Sin texto alternativo)</span>
                  `:``}
                `:``}

                <div class="phrase-ref-actions">
                  <button type="button" class="btn-copy-ref-line" data-line-idx="${n}" title="Copiar texto del verso original a este campo">
                    Copiar
                  </button>
                  ${t?`
                    <button type="button" class="btn-translate-ref-line" data-line-idx="${n}" title="Traducir automáticamente este verso al idioma actual">
                      Traducir
                    </button>
                  `:``}
                </div>
              </div>
            `}else l=`
              <div class="phrase-ref-guide is-missing" data-line-idx="${n}" title="No hay un verso correspondiente en ${$(y?.name||`Original`)}">
                <span class="phrase-ref-label">
                  ${u} ${$(y?.name||`Original`)} #${n+1}:
                </span>
                <span class="phrase-ref-text is-missing">(Sin verso correspondiente en original)</span>
              </div>
            `}let d=(e.syllables||[]).map((t,r)=>`
            <div class="syllable-edit-chip" data-line-idx="${n}" data-syl-idx="${r}">
              <div class="chip-top">
                <span class="syl-idx">#${r+1}</span>
                <input
                  type="text"
                  class="input-syl-text"
                  value="${$(t.text)}"
                  placeholder="Texto"
                  title="Texto de la sílaba o palabra (incluye espacio final si termina palabra)"
                  data-line-idx="${n}"
                  data-syl-idx="${r}"
                />
                <input
                  type="text"
                  class="input-syl-alt"
                  value="${$(t.altText||t.romaji||``)}"
                  placeholder="Romaji"
                  title="Texto alternativo fonético (Romaji / Pinyin) para esta sílaba"
                  data-line-idx="${n}"
                  data-syl-idx="${r}"
                />
                <button class="btn-remove-syl" data-line-idx="${n}" data-syl-idx="${r}" title="Quitar sílaba">${c}</button>
              </div>
              <div class="chip-bottom">
                <div class="syl-timing-item">
                  <label>Inicio (s):</label>
                  <div class="input-with-capture">
                    <input
                      type="number"
                      step="0.05"
                      class="input-syl-start"
                      value="${t.startTime??e.startTime??0}"
                      data-line-idx="${n}"
                      data-syl-idx="${r}"
                    />
                    <button class="btn-capture-syl-time" data-line-idx="${n}" data-syl-idx="${r}" title="Capturar tiempo actual del reproductor">${g}</button>
                  </div>
                </div>
                <div class="syl-timing-item">
                  <label>Duración (s):</label>
                  <input
                    type="number"
                    step="0.05"
                    class="input-syl-dur"
                    value="${t.duration??.3}"
                    data-line-idx="${n}"
                    data-syl-idx="${r}"
                  />
                </div>
              </div>
            </div>
          `).join(``);return`
          <article class="phrase-editor-card ${r?`is-expanded`:``}" data-line-idx="${n}">
            <div class="phrase-card-header">
              <div class="phrase-index-badge">#${n+1}</div>
              
              <div class="phrase-main-input-group">
                ${l}
                <input
                  type="text"
                  class="input-phrase-text"
                  placeholder="${b?`Traducción del verso #${n+1}...`:`Verso / caracteres originales...`}"
                  value="${$(e.text)}"
                  data-line-idx="${n}"
                />
                <input
                  type="text"
                  class="input-phrase-alt"
                  placeholder="${b?`Texto alternativo / notas (opcional)...`:`Texto alternativo (Romaji / Fonética)...`}"
                  value="${$(e.altText||e.romaji||``)}"
                  title="Texto alternativo en alfabeto latino (ej. Romaji para japonés o transliteración)"
                  data-line-idx="${n}"
                />
              </div>

              <div class="phrase-timing-bar">
                <div class="time-field" title="Tiempo de inicio de la frase en segundos">
                  <label>Inicio:</label>
                  <div class="input-with-capture">
                    <input
                      type="number"
                      step="0.1"
                      class="input-phrase-start"
                      value="${e.startTime??0}"
                      data-line-idx="${n}"
                    />
                    <button class="btn btn-xs btn-capture-line-start" data-line-idx="${n}" title="Capturar segundo actual del reproductor">${g}</button>
                  </div>
                </div>

                <div class="time-field" title="Tiempo de fin de la frase en segundos">
                  <label>Fin:</label>
                  <div class="input-with-capture">
                    <input
                      type="number"
                      step="0.1"
                      class="input-phrase-end"
                      value="${e.endTime??Number(e.startTime||0)+3}"
                      data-line-idx="${n}"
                    />
                    <button class="btn btn-xs btn-capture-line-end" data-line-idx="${n}" title="Capturar segundo actual del reproductor">${g}</button>
                  </div>
                </div>

                <button class="btn btn-xs btn-outline btn-listen-phrase" data-line-idx="${n}" title="Escuchar este verso en el audio">
                  ${ie} Probar
                </button>
              </div>

              <div class="phrase-actions">
                ${b?``:`
                  <button type="button" class="btn btn-xs btn-outline btn-toggle-syllables" data-line-idx="${n}" title="${r?`Contraer sílabas`:`Editar sílabas y tiempos`}">
                    Sílabas (${a}) ${r?p:s}
                  </button>
                `}
                <button type="button" class="btn btn-xs btn-outline btn-move-line-up" data-line-idx="${n}" title="Mover arriba" ${n===0?`disabled`:``}>${p}</button>
                <button type="button" class="btn btn-xs btn-outline btn-move-line-down" data-line-idx="${n}" title="Mover abajo" ${n===C.length-1?`disabled`:``}>${s}</button>
                <button type="button" class="btn btn-xs btn-outline btn-delete-line" data-line-idx="${n}" title="Eliminar este verso">${t}</button>
              </div>
            </div>

            <!-- Panel de Sílabas y Tiempos de Canto (solo en idioma principal) -->
            ${!b&&r?`
              <div class="phrase-syllables-panel">
                <div class="syllables-toolbar">
                  <div class="syllables-summary">
                    <span><strong>${a}</strong> sílaba(s)</span>
                    <span class="dur-badge">Duración total: <strong>${o.toFixed(2)}s</strong></span>
                  </div>

                  <div class="syllables-quick-actions">
                    <button class="btn btn-xs btn-outline btn-auto-syllables" data-line-idx="${n}" title="Dividir frase automáticamente en sílabas con ponderación fonética inteligente">
                      Silabear Automático
                    </button>
                    <button class="btn btn-xs btn-outline btn-auto-words" data-line-idx="${n}" title="Dividir frase por palabras">
                      Dividir en Palabras
                    </button>
                    <button class="btn btn-xs btn-outline btn-distribute-times" data-line-idx="${n}" title="Distribuir tiempos entre las sílabas con ponderación fonética inteligente">
                      ${g} Distribuir Tiempos
                    </button>
                    <button class="btn btn-xs btn-primary btn-add-syllable" data-line-idx="${n}">
                      ${i} Añadir Sílaba
                    </button>
                    <button class="btn btn-xs btn-outline btn-danger-outline btn-clear-line-syllables" data-line-idx="${n}" title="Borrar todas las sílabas de este verso" ${a===0?`disabled`:``}>
                      ${t} Borrar Sílabas
                    </button>
                  </div>
                </div>

                <!-- Cuadrícula de edición de sílabas -->
                <div class="syllables-grid">
                  ${d||`<div class="no-syl-message">Pulsa "Dividir en Sílabas Automático" o "Añadir Sílaba" para configurar los tiempos de canto.</div>`}
                </div>

                <!-- Previsualización reconstruida -->
                <div class="syllables-preview">
                  <span class="preview-label">Reconstrucción visual:</span>
                  <span class="preview-text">
                    ${(e.syllables||[]).map(e=>`<span class="syl-preview-span" title="Inicio: ${e.startTime}s, Duración: ${e.duration}s">${$(e.text)}</span>`).join(``)||`(vacío)`}
                  </span>
                </div>
              </div>
            `:``}
          </article>
        `}).join(``),L=ce.map((e,n)=>`
      <div class="video-config-row" data-video-idx="${n}">
        <input
          type="text"
          class="input-vid-name"
          placeholder="Nombre del video (ej. Oficial, Acústico)"
          value="${$(e.name)}"
          data-video-idx="${n}"
        />
        <input
          type="text"
          class="input-vid-url"
          placeholder="URL de YouTube / YouTube Music (ej. https://music.youtube.com/watch?v=...)"
          value="${$(e.url)}"
          data-video-idx="${n}"
        />
        <div class="video-offset-wrapper">
          <label>Offset (s):</label>
          <input
            type="number"
            step="0.1"
            class="input-vid-offset"
            value="${e.offset||0}"
            data-video-idx="${n}"
          />
        </div>
        <button class="btn btn-xs btn-outline btn-test-video-audio" data-video-idx="${n}" title="Probar audio de este video">${ie} Cargar</button>
        ${ce.length>1?`
          <button class="btn btn-xs btn-outline btn-remove-video" data-video-idx="${n}" title="Quitar video">${t}</button>
        `:``}
      </div>
    `).join(``),z=S?.getCurrentTime?Math.max(0,S.getCurrentTime()||0):0,V=S?.getDuration?Math.max(0,S.getDuration()||0):0,U=S?.getVolume?Math.max(0,Math.min(100,Math.round(S.getVolume()??100))):100;x.innerHTML=`
      <div class="song-editor-view-container">
        ${O?`
          <div class="status-alert status-${k}">
            <span class="status-alert-text">${$(O)}</span>
            <button type="button" class="btn-close-alert" id="btn-close-editor-alert" title="Cerrar aviso" aria-label="Cerrar aviso">${c}</button>
          </div>
        `:``}

        <!-- Asistente de Audio para Sincronización en Vivo -->
        <div class="editor-audio-assistant">
          <div class="assistant-controls">
            <!-- Izquierda: Parlante con menú vertical de volumen + Barra de progreso con tiempo -->
            <div class="assistant-left-group">
              <div class="editor-volume-wrapper" id="editor-volume-wrapper">
                <button
                  type="button"
                  class="btn btn-outline btn-xs btn-editor-volume ${H?`is-active`:``}"
                  id="btn-editor-volume"
                  title="Volumen: ${U}%"
                  aria-label="Volumen"
                >
                  ${U===0?ee:n}
                </button>
                <div class="editor-volume-popover ${H?`is-open`:``}" id="editor-volume-popover">
                  <span class="editor-volume-percent" id="editor-volume-percent">${U}%</span>
                  <div class="editor-volume-slider-track">
                    <input
                      type="range"
                      class="editor-volume-slider"
                      id="editor-volume-slider"
                      min="0"
                      max="100"
                      value="${U}"
                      orient="vertical"
                      aria-label="Nivel de volumen"
                    />
                  </div>
                </div>
              </div>

              <div class="editor-progress-group">
                <span class="editor-time-label" id="editor-progress-current">${f(Math.max(0,z))}</span>
                <input
                  type="range"
                  class="editor-progress-slider"
                  id="editor-progress-slider"
                  min="0"
                  max="${Math.max(1,V)}"
                  step="0.1"
                  value="${Math.max(0,z)}"
                  title="Posición de la canción"
                  aria-label="Posición de la canción"
                />
                <span class="editor-time-label" id="editor-progress-duration">${f(V)}</span>
              </div>
            </div>

            <!-- Centro: Botones de transporte, saltos, reloj y Modo Letra -->
            <div class="assistant-center-group">
              <button class="btn btn-primary btn-sm btn-assistant-play" id="btn-assistant-play" title="${S?.getIsPlaying()?`Pausar`:`Reproducir`}">
                ${S?.getIsPlaying()?`${o}`:`${ie}`}
              </button>
              <button class="btn btn-outline btn-xs btn-seek-rel" data-seek="-5" title="Retroceder 5 segundos">-5s</button>
              <button class="btn btn-outline btn-xs btn-seek-rel" data-seek="-1" title="Retroceder 1 segundo">-1s</button>
              <button class="btn btn-outline btn-xs btn-seek-rel" data-seek="-0.1" title="Retroceder 0.1 segundos">-0.1s</button>
              
              <div class="assistant-clock">
                <span class="clock-time" id="assistant-clock-time">${f(Math.max(0,z),!0)}</span>
              </div>

              <button class="btn btn-outline btn-xs btn-seek-rel" data-seek="0.1" title="Adelantar 0.1 segundos">+0.1s</button>
              <button class="btn btn-outline btn-xs btn-seek-rel" data-seek="1" title="Adelantar 1 segundo">+1s</button>
              <button class="btn btn-outline btn-xs btn-seek-rel" data-seek="5" title="Adelantar 5 segundos">+5s</button>

              <button class="btn btn-success btn-sm btn-assistant-sing" id="btn-save-and-sing" title="Guardar y probar en Modo Letra" aria-label="Probar en Modo Letra">
                ${re}
              </button>
            </div>

            <!-- Derecha: Indicador de guardado pegado al extremo derecho -->
            <div class="assistant-right-group">
              <span class="editor-autosave-badge ${I?`is-saving`:``}" id="editor-autosave-badge" title="Guardado automático activado">
                <span class="autosave-dot"></span>
                <span class="autosave-text">${I?`Guardando...`:`Guardado`}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="editor-content-scroll">
          <!-- Acordeón de Metadatos y Videos de la Canción -->
          <details class="editor-section-card" ${A?`open`:``} id="editor-metadata-details">
            <summary class="editor-section-summary">
              <span class="summary-title">Metadatos Generales y Videos Asociados</span>
              <span class="summary-badge">${$(T.title||`Completar datos`)} (${ce.length} video(s))</span>
            </summary>

            <div class="editor-section-body">
              <div class="form-row-grid">
                <div class="form-group">
                  <label for="input-song-title">Título de la Canción *:</label>
                  <input
                    type="text"
                    id="input-song-title"
                    class="form-input"
                    placeholder="Ej. Caminando por la Ciudad"
                    value="${$(T.title)}"
                  />
                </div>

                <div class="form-group">
                  <label for="input-song-artist">Artista o Banda:</label>
                  <input
                    type="text"
                    id="input-song-artist"
                    class="form-input"
                    placeholder="Ej. Soda Stereo, Queen, etc."
                    value="${$(T.artist)}"
                  />
                </div>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label for="input-song-genres">Géneros (separados por coma):</label>
                  <input
                    type="text"
                    id="input-song-genres"
                    class="form-input"
                    placeholder="Ej. Rock, Pop, Balada"
                    value="${$((T.genres||[]).join(`, `))}"
                  />
                </div>

                <div class="form-group">
                  <label for="input-song-tags">Etiquetas (separadas por coma):</label>
                  <input
                    type="text"
                    id="input-song-tags"
                    class="form-input"
                    placeholder="Ej. karaoke, acústico, enérgico"
                    value="${$((T.tags||[]).join(`, `))}"
                  />
                </div>
              </div>

              <!-- Lista de videos asociados -->
              <div class="videos-management-block">
                <div class="block-header">
                  <h4>Videos de YouTube / YouTube Music y Offsets</h4>
                  <button class="btn btn-xs btn-outline" id="btn-add-new-video">${i} Asociar Otro Video</button>
                </div>
                <div class="videos-list-container">
                  ${L}
                </div>
              </div>

              <!-- Opciones de Respaldo y Copia de Seguridad -->
              <div class="editor-backup-block">
                <div class="block-header">
                  <h4>Copias de Seguridad y Respaldo</h4>
                </div>
                <div class="backup-actions-row">
                  <button type="button" class="btn btn-outline btn-sm" id="btn-editor-export-json" title="Exportar paquete de canción JSON (copia de seguridad)">
                    ${l} Exportar JSON
                  </button>
                  <button type="button" class="btn btn-outline btn-sm" id="btn-editor-export-yaml" title="Exportar al estándar Lyricsfile (.yaml)">
                    ${l} Exportar Lyricsfile
                  </button>
                </div>
              </div>
            </div>
          </details>

          <!-- Sección de Idiomas y Frases -->
          <section class="editor-section-card editor-lyrics-section">
            <div class="editor-lyrics-header">
              <div class="lyrics-section-titles">
                <h3>Idiomas y Letras de la Canción</h3>
              </div>
            </div>

            <!-- Fila de Pestañas de Idiomas -->
            <div class="editor-lang-tabs-bar">
              ${fe}
              <button
                type="button"
                class="btn-add-lang-tab"
                id="btn-add-language"
                title="Añadir nuevo idioma o traducción"
                aria-label="Añadir nuevo idioma o traducción"
              >
                ${i}
              </button>
            </div>

            <!-- Barra de Herramientas de Frases -->
            <div class="phrases-toolbar">
              <div class="phrases-count">
                <span>Versos en <strong>${$(_?.name||`Idioma`)}</strong> (${C.length})</span>
                ${!b&&w>0?`<span class="phrases-syl-count">• <strong>${w}</strong> sílaba(s)</span>`:``}
                ${b?`
                  <div class="ref-mode-selector-wrapper" title="Configurar visualización de la frase original de referencia">
                    <label for="select-translation-ref-mode" class="ref-mode-label">
                      ${m} Guía original:
                    </label>
                    <select id="select-translation-ref-mode" class="ref-mode-select" title="Seleccionar qué mostrar como referencia mientras traduces">
                      <option value="both" ${P===`both`?`selected`:``}>Ambos (Original + Alternativo)</option>
                      <option value="text" ${P===`text`?`selected`:``}>Solo texto original</option>
                      <option value="alt" ${P===`alt`?`selected`:``}>Solo texto alternativo</option>
                      <option value="none" ${P===`none`?`selected`:``}>Desactivado</option>
                    </select>
                  </div>
                `:``}
              </div>

              <div class="phrases-tools">
                <button class="btn btn-sm btn-outline btn-open-quick-import" title="Pegar texto completo y dividir en versos">
                  ${d} Pegar Letra Completa
                </button>
                ${!b&&le?`
                  <button class="btn btn-sm btn-outline btn-auto-romaji" id="btn-auto-generate-romaji" title="Generar automáticamente texto alternativo y fonemas en Romaji para todas las frases y sílabas de este idioma">
                    ${a} Romaji Automático
                  </button>
                `:``}
                ${b&&(y?.lines?.length||0)>0?`
                  <button class="btn btn-sm btn-outline btn-auto-translate-all" id="btn-auto-translate-all" title="Traducir automáticamente todas las frases desde el idioma original (${$(y?.name||`Original`)}) al idioma actual (${$(_?.name||``)}) de forma gratuita">
                    ${a} Traducir Toda la Canción
                  </button>
                `:``}
                ${b?``:`
                  <button
                    class="btn btn-sm btn-outline btn-danger-outline"
                    id="btn-clear-all-syllables"
                    title="${w>0?`Borrar todas las sílabas de las frases de este idioma`:`No hay sílabas configuradas en ninguna frase`}"
                    ${w===0?`disabled`:``}
                  >
                    ${t} Borrar Todas las Sílabas
                  </button>
                `}
                <button class="btn btn-sm btn-primary" id="btn-add-phrase-top">
                  ${i} Añadir Frase
                </button>
              </div>
            </div>

            <!-- Listado de Frases / Líneas -->
            <div class="phrases-list-container">
              ${F}
            </div>

            ${C.length>0?`
              <div class="phrases-footer-actions">
                <button class="btn btn-outline" id="btn-add-phrase-bottom">
                  ${i} Añadir Frase al Final
                </button>
              </div>
            `:``}
          </section>
        </div>

        <!-- Modal de Importación Rápida de Letra Plana -->
        ${ue?`
          <div class="modal-backdrop"></div>
          <div class="modal-dialog modal-dialog-lg">
            <header class="modal-header">
              <div class="header-titles">
                <h2>Pegar Letra Completa</h2>
                <p class="subtitle">Pega el texto de la canción para generar versos y sílabas automáticamente.</p>
              </div>
              <button class="btn-close-modal btn-close-quick-import">${c}</button>
            </header>

            <div class="modal-body">
              <div class="form-group">
                <label for="textarea-quick-lyrics">Texto de la letra (un verso por línea):</label>
                <textarea
                  id="textarea-quick-lyrics"
                  class="quick-lyrics-textarea"
                  rows="10"
                  placeholder="This was a triumph&#10;I'm making a note here, huge success&#10;It's hard to overstate my satisfaction..."
                ></textarea>
              </div>

              <div class="quick-import-options-grid">
                <div class="form-group">
                  <label for="input-import-start-time">Segundo de inicio del primer verso:</label>
                  <input
                    type="number"
                    step="0.5"
                    id="input-import-start-time"
                    class="form-input"
                    value="${Math.max(0,S?.getCurrentTime()?+S.getCurrentTime().toFixed(1):2)}"
                  />
                </div>

                <div class="form-group">
                  <label for="input-import-duration">Duración promedio por verso (segundos):</label>
                  <input
                    type="number"
                    step="0.5"
                    id="input-import-duration"
                    class="form-input"
                    value="3.5"
                  />
                </div>

                <div class="form-group">
                  <label for="input-import-gap">Pausa entre versos (segundos):</label>
                  <input
                    type="number"
                    step="0.1"
                    id="input-import-gap"
                    class="form-input"
                    value="0.5"
                  />
                </div>
              </div>

              ${b?``:`
                <div class="quick-import-checkbox-row">
                  <label class="checkbox-label">
                    <input type="checkbox" id="check-auto-syllabify" checked />
                    <span>Dividir cada verso en sílabas automáticamente con tiempos proporcionales</span>
                  </label>
                </div>
              `}

              <div class="modal-footer-buttons">
                <button class="btn btn-outline btn-close-quick-import">Cancelar</button>
                <button class="btn btn-primary" id="btn-process-quick-import">
                  Generar Versos y Tiempos
                </button>
              </div>
            </div>
          </div>
        `:``}

        <!-- Modal para Añadir Idioma -->
        ${de?`
          <div class="modal-backdrop"></div>
          <div class="modal-dialog">
            <header class="modal-header">
              <div class="header-titles">
                <h2>Añadir Nuevo Idioma o Traducción</h2>
                <p class="subtitle">Configurá una nueva pista de idioma para esta canción</p>
              </div>
              <button class="btn-close-modal btn-close-add-lang">${c}</button>
            </header>

            <div class="modal-body">
              <div class="form-group">
                <label for="input-new-lang-name">Nombre del Idioma (ej. Inglés, Português, Japonés):</label>
                <input type="text" id="input-new-lang-name" class="form-input" placeholder="English (Traducción)" />
              </div>

              <div class="form-group">
                <label for="input-new-lang-code">Código ISO (ej. en, pt, ja, it, fr):</label>
                <input type="text" id="input-new-lang-code" class="form-input" placeholder="en" />
              </div>

              <div class="form-group">
                <label class="checkbox-label" for="check-copy-timings">
                  <input type="checkbox" id="check-copy-timings" checked />
                  <span>Copiar las marcas de tiempo del idioma principal (ideal para subtítulos traducidos)</span>
                </label>
              </div>

              <div class="form-group">
                <label class="checkbox-label" for="check-auto-translate">
                  <input type="checkbox" id="check-auto-translate" />
                  <span>Traducir automáticamente todas las frases desde el original (gratis)</span>
                </label>
              </div>

              <div class="modal-footer-buttons">
                <button class="btn btn-outline btn-close-add-lang">Cancelar</button>
                <button class="btn btn-primary" id="btn-confirm-add-lang">
                  ${i} Añadir Idioma
                </button>
              </div>
            </div>
          </div>
        `:``}

        <!-- Modal para Editar Nombre y Código de Idioma -->
        ${j&&_?`
          <div class="modal-backdrop"></div>
          <div class="modal-dialog">
            <header class="modal-header">
              <div class="header-titles">
                <h2>Configurar Idioma</h2>
                <p class="subtitle">Modificá el nombre visible, código ISO y opciones de la pista</p>
              </div>
              <button class="btn-close-modal btn-close-edit-lang">${c}</button>
            </header>

            <div class="modal-body">
              <div class="form-group">
                <label for="input-edit-lang-name">Nombre del Idioma (ej. Español (Original), English, 日本語):</label>
                <input
                  type="text"
                  id="input-edit-lang-name"
                  class="form-input"
                  value="${$(_.name)}"
                  placeholder="Nombre del idioma"
                />
              </div>

              <div class="form-group">
                <label for="input-edit-lang-code">Código ISO (ej. es, en, ja, fr, de, pt):</label>
                <input
                  type="text"
                  id="input-edit-lang-code"
                  class="form-input"
                  value="${$(_.code)}"
                  placeholder="Código ISO (ej. es, en)"
                />
              </div>

              <div class="modal-lang-actions-section">
                ${_.isMain?`
                  <span class="main-lang-indicator-badge" title="Este idioma está configurado como la pista original">
                    ★ Idioma Principal
                  </span>
                `:`
                  <button type="button" class="btn btn-sm btn-outline" id="btn-modal-set-lang-main" title="Establecer este idioma como la pista principal original">
                    Hacer Principal
                  </button>
                `}

                <button
                  type="button"
                  class="btn btn-sm btn-outline btn-danger-outline"
                  id="btn-modal-delete-lang"
                  ${_.isMain?`disabled title="El idioma principal no se puede eliminar. Para eliminarlo, primero debes hacer principal a otro idioma."`:`title="Eliminar esta pista de idioma y sus frases"`}
                >
                  ${t} Eliminar Idioma
                </button>
              </div>

              <div class="modal-footer-buttons">
                <button class="btn btn-outline btn-close-edit-lang">Cancelar</button>
                <button class="btn btn-primary" id="btn-confirm-edit-lang">
                  ${e} Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        `:``}
        <!-- Overlay bloqueante de traducción completa en curso -->
        ${M?`
          <div class="modal-backdrop translation-loading-backdrop"></div>
          <div class="translation-loading-dialog" role="dialog" aria-modal="true" aria-label="Traduciendo canción">
            <div class="translation-loading-spinner"></div>
            <div class="translation-loading-content">
              <h3 class="translation-loading-title">${a} Traduciendo Canción</h3>
              <p class="translation-loading-desc">${$(N||`Traduciendo todas las frases... Por favor espera.`)}</p>
            </div>
          </div>
        `:``}
      </div>
    `;let W=x.querySelector(`.editor-content-scroll`);W&&te>0&&(W.scrollTop=te);let G=x.querySelector(`.editor-lang-tabs-bar`);G&&oe>0&&(G.scrollLeft=oe),typeof window<`u`&&se>0&&window.scrollTo(0,se),xe(),be(S&&typeof S.getCurrentTime==`function`?Math.max(0,S.getCurrentTime()):0)}function xe(){let e=x.querySelector(`#btn-close-editor-alert`);e&&e.addEventListener(`click`,()=>{O=``;let e=x.querySelector(`.status-alert`);e&&e.remove()});let t=x.querySelector(`#btn-editor-back`);t&&t.addEventListener(`click`,async()=>{F&&(clearTimeout(F),F=null,await we()),U&&=(document.removeEventListener(`click`,U),null),J(),ce&&ce()});let r=x.querySelector(`#input-song-title`);r&&(r.addEventListener(`input`,e=>{T.title=e.target.value;let t=x.querySelector(`.editor-section-summary .summary-badge`);t&&(t.textContent=`${e.target.value.trim()||`Completar datos`} (${(T.videos||[]).length} video(s))`),X(400)}),r.addEventListener(`change`,()=>{Z()}));let i=x.querySelector(`#input-song-artist`);i&&(i.addEventListener(`input`,e=>{T.artist=e.target.value,X(400)}),i.addEventListener(`change`,()=>{Z()}));let a=x.querySelector(`#input-song-genres`);if(a){let e=e=>{T.genres=e.target.value.split(`,`).map(e=>e.trim()).filter(Boolean),X(400)};a.addEventListener(`input`,e),a.addEventListener(`change`,()=>{e({target:a}),Z()})}let s=x.querySelector(`#input-song-tags`);if(s){let e=e=>{T.tags=e.target.value.split(`,`).map(e=>e.trim()).filter(Boolean),X(400)};s.addEventListener(`input`,e),s.addEventListener(`change`,()=>{e({target:s}),Z()})}x.querySelectorAll(`.video-config-row`).forEach(e=>{let t=Number(e.dataset.videoIdx),n=e.querySelector(`.input-vid-name`),r=e.querySelector(`.input-vid-url`),i=e.querySelector(`.input-vid-offset`),a=e.querySelector(`.btn-test-video-audio`),o=e.querySelector(`.btn-remove-video`);n&&(n.addEventListener(`input`,e=>{T.videos[t]&&(T.videos[t].name=e.target.value),X(400)}),n.addEventListener(`change`,()=>{Z()})),r&&(r.addEventListener(`input`,e=>{T.videos[t]&&(T.videos[t].url=e.target.value),X(400)}),r.addEventListener(`change`,()=>{Z()})),i&&(i.addEventListener(`input`,e=>{T.videos[t]&&(T.videos[t].offset=Number(e.target.value)||0),X(400)}),i.addEventListener(`change`,()=>{Z()})),a&&a.addEventListener(`click`,async()=>{let e=T.videos[t];if(e&&e.url&&S)try{await S.loadSong(T,e.id),K(`Audio cargado para probar: "${e.name}"`,`success`)}catch(e){K(`Error al cargar video: `+e.message,`error`)}else K(`Ingresá una URL de YouTube o YouTube Music válida primero.`,`error`)}),o&&o.addEventListener(`click`,()=>{T.videos.splice(t,1),Y(),Z()})});let c=x.querySelector(`#btn-add-new-video`);c&&c.addEventListener(`click`,()=>{let e=(T.videos||[]).length+1;T.videos.push({id:`vid-${Date.now()}-${e}`,name:`Pista / Video ${e}`,url:``,offset:0}),Y(),Z()});let l=x.querySelector(`#btn-assistant-play`);l&&S&&l.addEventListener(`click`,async()=>{await S.togglePlay(),l.innerHTML=S.getIsPlaying()?`${o}`:`${ie}`}),x.querySelectorAll(`.btn-seek-rel`).forEach(e=>{e.addEventListener(`click`,()=>{let t=Number(e.dataset.seek);if(S){let e=S.getCurrentTime();S.seek(Math.max(0,e+t))}})});let u=x.querySelector(`#btn-editor-volume`),d=x.querySelector(`#editor-volume-popover`),p=x.querySelector(`#editor-volume-slider`),m=x.querySelector(`#editor-volume-percent`);u&&d&&u.addEventListener(`click`,e=>{e.stopPropagation(),H=!H,d.classList.toggle(`is-open`,H),u.classList.toggle(`is-active`,H)}),d&&d.addEventListener(`click`,e=>{e.stopPropagation()}),p&&p.addEventListener(`input`,e=>{let t=Number(e.target.value);S?.setVolume&&S.setVolume(t),m&&(m.textContent=`${t}%`),u&&(u.innerHTML=t===0?ee:n,u.title=`Volumen: ${t}%`)}),U&&=(document.removeEventListener(`click`,U),null),U=e=>{if(!H)return;let t=x.querySelector(`#editor-volume-wrapper`);if(t&&!t.contains(e.target)){H=!1;let e=x.querySelector(`#editor-volume-popover`);e&&e.classList.remove(`is-open`);let t=x.querySelector(`#btn-editor-volume`);t&&t.classList.remove(`is-active`)}},document.addEventListener(`click`,U);let h=x.querySelector(`#editor-progress-slider`),g=x.querySelector(`#editor-progress-current`);h&&(h.addEventListener(`mousedown`,()=>{V=!0}),h.addEventListener(`touchstart`,()=>{V=!0},{passive:!0}),h.addEventListener(`input`,e=>{V=!0;let t=Number(e.target.value);g&&(g.textContent=f(t));let n=x.querySelector(`#assistant-clock-time`);n&&(n.textContent=f(t,!0)),be(t)}),h.addEventListener(`change`,e=>{let t=Number(e.target.value);S?.seek&&S.seek(t),V=!1}),h.addEventListener(`mouseup`,()=>{V=!1}),h.addEventListener(`touchend`,()=>{V=!1})),x.querySelectorAll(`.editor-lang-tab`).forEach(e=>{e.addEventListener(`click`,()=>{let t=Number(e.dataset.langIdx);t===E?(j=!0,Y()):(E=t,Y())})});let re=x.querySelector(`#btn-edit-active-lang`);re&&re.addEventListener(`click`,()=>{j=!0,Y()});let ae=x.querySelector(`.btn-trigger-edit-lang`);ae&&ae.addEventListener(`click`,()=>{j=!0,Y()});let C=x.querySelector(`#btn-add-language`);C&&C.addEventListener(`click`,()=>{de=!0,Y()});let w=x.querySelector(`#btn-modal-set-lang-main`)||x.querySelector(`#btn-set-lang-main`);w&&w.addEventListener(`click`,()=>{let e=x.querySelector(`#input-edit-lang-name`),t=x.querySelector(`#input-edit-lang-code`),n=q();e&&e.value.trim()&&n&&(n.name=e.value.trim()),t&&t.value.trim()&&n&&(n.code=t.value.trim().toLowerCase());let r=T.lyrics_data.languages;r.forEach((e,t)=>{e.isMain=t===E}),K(`"${r[E].name}" establecido como Idioma Principal.`,`success`),Z()});let k=x.querySelector(`#btn-modal-delete-lang`)||x.querySelector(`#btn-delete-active-lang`);k&&k.addEventListener(`click`,()=>{let e=q();e?.isMain||window.confirm(`¿Seguro que deseas eliminar el idioma "${e?.name}"?`)&&(T.lyrics_data.languages.splice(E,1),E=0,j=!1,K(`Idioma eliminado.`,`info`),Z())});let A=q(),I=T.lyrics_data.languages||[],L=I.find(e=>e.isMain)||I[0],R=A?.lines||[],z=x.querySelector(`#btn-add-phrase-top`),B=x.querySelector(`#btn-add-phrase-bottom`),pe=x.querySelector(`.btn-add-first-line`),W=()=>{let e=R[R.length-1],t=e?+(Number(e.endTime||0)+.5).toFixed(1):2,n=+(t+3.5).toFixed(1),r={id:`line-${A.code}-${Date.now()}`,text:``,startTime:t,endTime:n,syllables:[]};R.push(r),D.add(R.length-1),Y(),Z()};z&&z.addEventListener(`click`,W),B&&B.addEventListener(`click`,W),pe&&pe.addEventListener(`click`,W);let G=x.querySelector(`#select-translation-ref-mode`);G&&G.addEventListener(`change`,e=>{P=e.target.value;try{localStorage.setItem(le,P)}catch{}Y()}),x.querySelectorAll(`.phrase-editor-card`).forEach(e=>{let t=Number(e.dataset.lineIdx),n=R[t];if(!n)return;let r=e.querySelector(`.input-phrase-text`),i=e.querySelector(`.input-phrase-alt`),a=e.querySelector(`.input-phrase-start`),o=e.querySelector(`.input-phrase-end`),s=e.querySelector(`.btn-capture-line-start`),c=e.querySelector(`.btn-capture-line-end`),l=e.querySelector(`.btn-listen-phrase`),u=e.querySelector(`.btn-toggle-syllables`),d=e.querySelector(`.btn-move-line-up`),f=e.querySelector(`.btn-move-line-down`),ee=e.querySelector(`.btn-delete-line`),p=e.querySelector(`.btn-copy-ref-line`);p&&p.addEventListener(`click`,()=>{let e=L?.lines?.[t];e&&(n.text=e.text||``,e.altText&&(n.altText=e.altText),Y(),K(`Texto original copiado al verso #${t+1}.`,`info`),Z())});let m=e.querySelector(`.btn-translate-ref-line`);m&&m.addEventListener(`click`,async()=>{let e=L?.lines?.[t];if(!e||!e.text||!e.text.trim()){K(`El verso original está vacío o es una pausa instrumental.`,`info`);return}m.disabled=!0,m.textContent=`Traduciendo...`;try{let r=A.code||`es`,i=L?.code||`auto`,a=await _(e.text,r,i);a?(n.text=a,n.syllables=[],Y(),K(`Verso #${t+1} traducido automáticamente a "${A.name}".`,`success`),Z()):(K(`No se pudo traducir el verso #${t+1}.`,`error`),m.disabled=!1,m.textContent=`Traducir`)}catch(e){console.error(`Error al traducir verso:`,e),K(`Error de red al intentar traducir el verso.`,`error`),m.disabled=!1,m.textContent=`Traducir`}});let h=e.querySelector(`.btn-auto-syllables`),te=e.querySelector(`.btn-auto-words`),ne=e.querySelector(`.btn-distribute-times`),g=e.querySelector(`.btn-add-syllable`);r&&(r.addEventListener(`input`,e=>{n.text=e.target.value,X(400)}),r.addEventListener(`change`,()=>{Z()})),i&&(i.addEventListener(`input`,e=>{n.altText=e.target.value,X(400)}),i.addEventListener(`change`,()=>{Z()})),a&&(a.addEventListener(`input`,e=>{n.startTime=Number(e.target.value)||0,X(400)}),a.addEventListener(`change`,()=>{Z()})),o&&(o.addEventListener(`input`,e=>{n.endTime=Number(e.target.value)||0,X(400)}),o.addEventListener(`change`,()=>{Z()})),s&&s.addEventListener(`click`,()=>{if(S){let e=Math.max(0,S.getCurrentTime());n.startTime=+e.toFixed(2),n.endTime<=n.startTime&&(n.endTime=+(n.startTime+3).toFixed(2)),Y(),Z()}}),c&&c.addEventListener(`click`,()=>{if(S){let e=Math.max(0,S.getCurrentTime());n.endTime=+e.toFixed(2),Y(),Z()}}),l&&l.addEventListener(`click`,async()=>{if(S){S.seek(n.startTime),await S.play(),fe&&clearTimeout(fe);let e=Math.max(500,(n.endTime-n.startTime)*1e3);fe=setTimeout(()=>{S.pause()},e)}}),u&&u.addEventListener(`click`,e=>{e.preventDefault(),D.has(t)?D.delete(t):D.add(t),Y()}),d&&t>0&&d.addEventListener(`click`,()=>{let e=R[t];R[t]=R[t-1],R[t-1]=e,Y(),Z()}),f&&t<R.length-1&&f.addEventListener(`click`,()=>{let e=R[t];R[t]=R[t+1],R[t+1]=e,Y(),Z()}),ee&&ee.addEventListener(`click`,()=>{R.splice(t,1),D.delete(t),Y(),Z()}),h&&h.addEventListener(`click`,()=>{if(!n.text.trim()){K(`Escribí el texto de la frase antes de dividir en sílabas.`,`error`);return}let e=y(n.text);n.syllables=v(e,n.startTime,n.endTime),K(`Frase #${t+1} dividida en ${n.syllables.length} sílaba(s) con ponderación fonética.`,`success`),Z()}),te&&te.addEventListener(`click`,()=>{if(!n.text.trim()){K(`Escribí el texto de la frase antes de dividir en palabras.`,`error`);return}let e=oe(n.text);n.syllables=v(e,n.startTime,n.endTime),K(`Frase #${t+1} dividida en ${n.syllables.length} palabra(s) con ponderación fonética.`,`success`),Z()}),ne&&ne.addEventListener(`click`,()=>{if(!n.syllables||n.syllables.length===0){K(`Añade o genera sílabas antes de distribuir tiempos.`,`error`);return}n.syllables=v(n.syllables,n.startTime,n.endTime),K(`Tiempos calculados con ponderación fonética para el verso #${t+1}.`,`success`),Z()}),g&&g.addEventListener(`click`,()=>{n.syllables||=[];let e=n.syllables[n.syllables.length-1],t=e?+(e.startTime+e.duration).toFixed(2):n.startTime;n.syllables.push({id:`syl-${Date.now()}-${n.syllables.length}`,text:``,startTime:t,duration:.35}),Y(),Z()}),e.querySelectorAll(`.btn-clear-line-syllables`).forEach(e=>{e.addEventListener(`click`,e=>{e.stopPropagation(),n.syllables&&n.syllables.length!==0&&(n.syllables=[],Y(),K(`Sílabas borradas del verso #${t+1}.`,`info`),Z())})}),e.querySelectorAll(`.syllable-edit-chip`).forEach(e=>{let t=Number(e.dataset.sylIdx),r=n.syllables[t];if(!r)return;let i=e.querySelector(`.input-syl-text`),a=e.querySelector(`.input-syl-alt`),o=e.querySelector(`.input-syl-start`),s=e.querySelector(`.input-syl-dur`),c=e.querySelector(`.btn-capture-syl-time`),l=e.querySelector(`.btn-remove-syl`);i&&(i.addEventListener(`input`,e=>{r.text=e.target.value,X(400)}),i.addEventListener(`change`,()=>{Z()})),a&&(a.addEventListener(`input`,e=>{r.altText=e.target.value,X(400)}),a.addEventListener(`change`,()=>{Z()})),o&&(o.addEventListener(`input`,e=>{r.startTime=Number(e.target.value)||0,X(400)}),o.addEventListener(`change`,()=>{Z()})),s&&(s.addEventListener(`input`,e=>{r.duration=Number(e.target.value)||.1,X(400)}),s.addEventListener(`change`,()=>{Z()})),c&&c.addEventListener(`click`,()=>{if(S){let e=Math.max(0,S.getCurrentTime());r.startTime=+e.toFixed(2),Y(),Z()}}),l&&l.addEventListener(`click`,()=>{n.syllables.splice(t,1),Y(),Z()})})});let me=()=>{let e=R.reduce((e,t)=>e+(t.syllables?.length||0),0);if(e===0){K(`No hay sílabas configuradas en ninguna frase de este idioma.`,`info`);return}let t=A?.name||`este idioma`,n=`¿Estás seguro de que deseas borrar todas las sílabas (${e} sílaba${e===1?``:`s`} en ${R.length} verso${R.length===1?``:`s`}) del idioma "${t}"?\n\nEsta acción eliminará los tiempos silábicos de canto de todas las frases.`;window.confirm(n)&&(R.forEach(e=>{e.syllables=[]}),Y(),K(`Se han borrado todas las sílabas de los ${R.length} versos en "${t}".`,`success`),Z())},he=x.querySelector(`#btn-clear-all-syllables`);he&&he.addEventListener(`click`,me);let ge=x.querySelector(`.btn-clear-all-syllables-trigger`);ge&&ge.addEventListener(`click`,me);let _e=x.querySelector(`#btn-auto-generate-romaji`);_e&&_e.addEventListener(`click`,()=>{if(!R||R.length===0){K(`No hay frases para transliterar en este idioma.`,`info`);return}let e=se(R);A&&(A.lines=e,(A.code===`und`||A.code===`en`)&&(A.code=`ja`,A.isMain&&(A.name=`Japonés (Original)`))),Y(),K(`Texto alternativo y fonemas en Romaji generados con éxito para todas las frases y sílabas.`,`success`),Z()});let ve=async()=>{if(!L||!L.lines||L.lines.length===0){K(`No hay versos originales en el idioma principal para traducir.`,`info`);return}let e=`¿Deseas traducir automáticamente todas las frases de "${L.name}" a "${A.name}"?\n(Se conservarán los tiempos y pausas instrumentales)`;if(typeof window>`u`||!window.confirm||window.confirm(e)){M=!0,N=`Traduciendo toda la canción a "${A.name}"... Por favor espera.`,Y();try{let e=L.lines.map(e=>e.text||``),t=A.code||`es`,n=L?.code||`auto`,{translatedLines:r}=await b(e,t,n),i=0;A.lines=L.lines.map((e,t)=>{let n=r[t]||``;return n.trim().length>0&&i++,{id:A.lines?.[t]?.id||`line-${A.code}-${Date.now()}-${t}`,startTime:e.startTime,endTime:e.endTime,text:n,syllables:[]}}),A.plain=A.lines.map(e=>e.text).join(`
`),K(`¡Canción traducida con éxito! Se tradujeron ${i} frases a "${A.name}".`,`success`)}catch(e){console.error(`Error al traducir canción completa:`,e),K(`Error al traducir la canción. Comprueba tu conexión a internet.`,`error`)}finally{M=!1,N=``,Y(),Z()}}};x.querySelectorAll(`.btn-auto-translate-all`).forEach(e=>{e.addEventListener(`click`,ve)}),x.querySelectorAll(`.btn-open-quick-import`).forEach(e=>{e.addEventListener(`click`,()=>{ue=!0,Y()})}),x.querySelectorAll(`.btn-close-quick-import`).forEach(e=>{e.addEventListener(`click`,()=>{ue=!1,Y()})});let ye=x.querySelector(`#btn-process-quick-import`);ye&&ye.addEventListener(`click`,()=>{let e=x.querySelector(`#textarea-quick-lyrics`),t=x.querySelector(`#input-import-start-time`),n=x.querySelector(`#input-import-duration`),r=x.querySelector(`#input-import-gap`),i=x.querySelector(`#check-auto-syllabify`),a=e?.value||``,o=a.split(`
`).map(e=>e.trim()).filter(Boolean);if(o.length===0){alert(`Por favor pega el texto de la letra antes de procesar.`);return}let s=Number(t?.value)||2,c=Number(n?.value)||3.5,l=Number(r?.value)||.5,u=i?.checked??!0,d=o.map((e,t)=>{let n=+s.toFixed(2),r=+(n+c).toFixed(2);s=r+l;let i=[];if(u){let t=y(e);i=v(t,n,r)}return{id:`line-${A.code}-${Date.now()}-${t}`,text:e,startTime:n,endTime:r,syllables:i}});A.lines=d,A.plain=a,D=new Set([0]),ue=!1,Y(),K(`¡Se generaron ${d.length} versos exitosamente para "${A.name}"!`,`success`),Z()}),x.querySelectorAll(`.btn-close-add-lang`).forEach(e=>{e.addEventListener(`click`,()=>{de=!1,Y()})});let xe=x.querySelector(`#check-auto-translate`),Se=x.querySelector(`#check-copy-timings`);xe&&Se&&xe.addEventListener(`change`,()=>{xe.checked&&(Se.checked=!0)});let Ce=x.querySelector(`#btn-confirm-add-lang`);Ce&&Ce.addEventListener(`click`,async()=>{let e=x.querySelector(`#input-new-lang-name`),t=x.querySelector(`#input-new-lang-code`),n=x.querySelector(`#check-copy-timings`),r=x.querySelector(`#check-auto-translate`),i=(e?.value||``).trim(),a=(t?.value||``).trim().toLowerCase(),o=n?.checked??!0,s=r?.checked??!1;if(!i||!a){alert(`Ingresa el nombre y el código del nuevo idioma.`);return}if(T.lyrics_data.languages.some(e=>e.code===a)){alert(`Ya existe un idioma con el código "${a}". Utilizá otro.`);return}let c=T.lyrics_data.languages.find(e=>e.isMain)||T.lyrics_data.languages[0],l=[];if(s&&c&&Array.isArray(c.lines)&&c.lines.length>0){de=!1,M=!0,N=`Traduciendo canción a "${i}"... Por favor espera.`,Y();try{let e=c.lines.map(e=>e.text||``),{translatedLines:t}=await b(e,a,c.code),n=0;l=c.lines.map((e,r)=>{let i=t[r]||``;return i.trim().length>0&&n++,{id:`line-${a}-${Date.now()}-${r}`,text:i,startTime:e.startTime,endTime:e.endTime,syllables:[]}});let r={code:a,name:i,isMain:!1,plain:l.map(e=>e.text).join(`
`),lines:l};T.lyrics_data.languages.push(r),E=T.lyrics_data.languages.length-1,K(`Nuevo idioma "${i}" [${a}] añadido y ${n} frases traducidas automáticamente.`,`success`),Z();return}catch(e){console.error(`Error al autotraducir al añadir idioma:`,e),K(`Error al traducir automáticamente.`,`error`)}finally{M=!1,N=``,Y()}}o&&c&&Array.isArray(c.lines)&&(l=c.lines.map((e,t)=>({id:`line-${a}-${Date.now()}-${t}`,text:``,startTime:e.startTime,endTime:e.endTime,syllables:[]})));let u={code:a,name:i,isMain:!1,plain:``,lines:l};T.lyrics_data.languages.push(u),E=T.lyrics_data.languages.length-1,de=!1,Y(),K(`Nuevo idioma "${i}" [${a}] añadido con éxito.`,`success`),Z()}),x.querySelectorAll(`.btn-close-edit-lang`).forEach(e=>{e.addEventListener(`click`,()=>{j=!1,Y()})});let Q=x.querySelector(`#btn-confirm-edit-lang`);Q&&Q.addEventListener(`click`,()=>{let e=x.querySelector(`#input-edit-lang-name`),t=x.querySelector(`#input-edit-lang-code`),n=(e?.value||``).trim(),r=(t?.value||``).trim().toLowerCase();if(!n||!r){alert(`Por favor ingresa un nombre y un código ISO válidos.`);return}if(T.lyrics_data.languages.some((e,t)=>t!==E&&e.code===r)){alert(`Ya existe otro idioma con el código "${r}". Elegí un código diferente.`);return}let i=q();i&&(i.name=n,i.code=r,j=!1,Y(),K(`Idioma actualizado correctamente: "${n}" [${r}].`,`success`),Z())});let Ee=x.querySelector(`#btn-editor-export-json`);Ee&&Ee.addEventListener(`click`,async()=>{try{let e=await Te(!1,!1);if(!e)return;await ne(e),K(`Paquete de canción JSON descargado con éxito.`,`success`)}catch(e){K(`Error al exportar JSON: `+e.message,`error`)}});let De=x.querySelector(`#btn-editor-export-yaml`);De&&De.addEventListener(`click`,async()=>{try{let e=await Te(!1,!1);if(!e)return;let t=q();await te(e,t?.code||null),K(`Archivo .lyricsfile.yaml descargado con éxito.`,`success`)}catch(e){K(`Error al exportar YAML: `+e.message,`error`)}});let Oe=x.querySelector(`#btn-save-song`);Oe&&Oe.addEventListener(`click`,async()=>{await Te(!1)});let ke=x.querySelector(`#btn-save-and-sing`);ke&&ke.addEventListener(`click`,async()=>{await Te(!0)})}function Se(e){let t=x?.querySelector(`#editor-autosave-badge`);if(!t)return;let n=t.querySelector(`.autosave-text`);t.classList.remove(`is-saving`,`is-error`),e===`saving`?(t.classList.add(`is-saving`),n&&(n.textContent=`Guardando...`)):e===`error`?(t.classList.add(`is-error`),n&&(n.textContent=`Error al guardar`)):n&&(n.textContent=`Guardado`)}function Ce(){if(!T)return null;let e=x?.querySelector(`#input-song-title`)?.value,t=x?.querySelector(`#input-song-artist`)?.value;e!==void 0&&(T.title=e),t!==void 0&&(T.artist=t);let n=T.title&&T.title.trim()||`Sin Título`,r=T.artist&&T.artist.trim()||`Artista Desconocido`;return{...T,title:n,artist:r,genres:Array.isArray(T.genres)?T.genres:[],tags:Array.isArray(T.tags)?T.tags:[],videos:(T.videos||[]).map((e,t)=>({id:e.id||`vid-${Date.now()}-${t}`,name:(e.name||`Video ${t+1}`).trim(),url:(e.url||``).trim(),offset:Number(e.offset)||0})),lyrics_data:{...T.lyrics_data,videos:T.videos,languages:(T.lyrics_data?.languages||[]).map(e=>({...e,plain:(e.lines||[]).map(e=>e.text||``).join(`
`),lines:(e.lines||[]).map((t,n)=>({id:t.id||`line-${e.code}-${n}`,text:t.text||``,altText:String(t.altText||t.romaji||``).trim(),startTime:Number(t.startTime)||0,endTime:Number(t.endTime)||Number(t.startTime||0)+3,syllables:e.isMain?(t.syllables||[]).map((e,t)=>({id:e.id||`syl-${n}-${t}`,text:e.text||``,altText:String(e.altText||e.romaji||``),startTime:Number(e.startTime)||0,duration:Number(e.duration)||.3})):[]}))}))}}}async function we(){if(!T)return null;let e=Ce();if(!e)return null;Se(`saving`),I=!0;try{let t=await r(e);T.id=t,T.artist=e.artist,T.title||(T.title=e.title);let n=x?.querySelector(`.editor-subheading`);return n&&(n.textContent=`Artista: ${$(T.artist)} | ID: ${T.id}`),Se(`saved`),C&&await C(t),t}catch(e){return console.error(`Error al guardar automáticamente:`,e),Se(`error`),null}finally{I=!1,L&&(L=!1,we())}}function X(e=400){Se(`saving`),F&&clearTimeout(F),F=setTimeout(()=>{F=null,I?L=!0:we()},e)}async function Z(){return F&&=(clearTimeout(F),null),I?(L=!0,null):await we()}async function Te(e=!1,t=!0){F&&=(clearTimeout(F),null);let n=x.querySelector(`#input-song-title`)?.value,r=x.querySelector(`#input-song-artist`)?.value;if(n!==void 0&&(T.title=n),r!==void 0&&(T.artist=r),!T.title||!T.title.trim()){K(`La canción debe tener un título obligatorio.`,`error`);let e=x.querySelector(`#editor-metadata-details`);e&&(e.open=!0);let t=x.querySelector(`#input-song-title`);return t&&t.focus(),null}let i=await we();return i?(t&&K(`¡Canción "${T.title}" guardada exitosamente!`,`success`),e&&w&&(U&&=(document.removeEventListener(`click`,U),null),J(),w(i)),i):null}let Q=null,Ee=null,De=null,Oe=null,ke=-1;function Ae(e){if(!x)return;let t=Math.max(0,e);if((!Q||!x.contains(Q))&&(Q=x.querySelector(`#assistant-clock-time`),Ee=x.querySelector(`#editor-progress-slider`),De=x.querySelector(`#editor-progress-current`),Oe=x.querySelector(`#editor-progress-duration`)),Q&&(Q.textContent=f(t,!0)),!V){let e=S?.getDuration?S.getDuration():0;Ee&&(Ee.max=String(Math.max(1,e)),Ee.value=String(t));let n=Math.floor(t);n!==ke&&(ke=n,De&&(De.textContent=f(t)),Oe&&(Oe.textContent=f(e)))}be(t)}function je(e){let t=x?.querySelector(`#btn-assistant-play`);t&&(t.innerHTML=e?`${o}`:`${ie}`)}function $(e){return e?String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#039;`):``}return{open:ve,updateClock:Ae,setPlayingState:je,flushAutoSave:Z,destroy:()=>{U&&=(document.removeEventListener(`click`,U),null),J()},clearStatus:()=>{O=``;let e=x?.querySelector(`.status-alert`);e&&e.remove()}}}export{x as createSongEditorView};