import { useArticleMetadata } from '../../components/article/useArticleMetadata';
import { ReaderMarkdown } from '../../components/article/ReaderMarkdown';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useLocation, useNavigate, useNavigationType, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MoreHorizontal, Heart, Share2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { useArticleBySlugQuery, useDeleteArticleMutation, useIncrementArticleViewMutation, useRelatedArticlesQuery } from '../../features/articles/articlesApi';
import { useToggleLikeMutation } from '../../features/likes/likesApi';
import { useCreateHighlightMutation } from '../../features/highlights/highlightsApi';
import { pushToast } from '../../features/ui/uiSlice';
import { useLogoutUserMutation } from '../../features/auth/authApi';
import { logout } from '../../features/auth/authSlice';
import { AuthPrompt } from '../../components/auth/AuthPrompt';
import { SaveToCollectionButton } from '../../components/saved/SaveToCollectionButton';
import { FollowButton } from '../../components/profile/FollowButton';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { CommentThread } from '../../components/article/CommentThread';
import { ArticleDetailSkeleton } from '../../components/article/ArticleDetailSkeleton';
import { ArticleOutline } from '../../components/article/ArticleOutline';
import { ReaderSurface } from '../../components/article/ReaderSurface';
import { ReaderNotebook, type NotebookTab } from '../../components/article/ReaderNotebook';
import { capturePassage, togglePanel, type Passage, type SupportPanel } from '../../components/article/readerModel';
import { useReaderAppearance, readerDefaults } from '../../components/article/useReaderAppearance';
import { useReaderProgress } from '../../components/article/useReaderProgress';
import { consumePendingArticleNavigation, isModifiedNavigationEvent } from '../../motion/articleTransition';
import { MOTION_DURATION, MOTION_IN_OUT_EASE, useReducedMotionPreference } from '../../motion/system';
import { useScrollAwareDock } from '../../motion/useScrollAwareDock';
import { formatDate } from '../../utils/formatDate';
import { getImageSrc } from '../../utils/image';
import { useArticleLinkActivation } from '../../motion/useArticleLinkProps';
import type { Article, AppearanceSettings } from '../../types/models';

function RelatedRow({ article }: { article: Article }) {
  const href = `/articles/${article.author?.username}/${article.slug}`;
  const activation = useArticleLinkActivation({ slug: article.slug, to: href, state: { initialArticle: article } });
  return <Link to={href} state={{ initialArticle: article }} {...activation.linkAttributes} onClick={activation.handleClick} onPointerDown={activation.handlePointerDown} onPointerUp={activation.clearActivating} onKeyDown={activation.handleKeyDown} className="reader-related-row"><h3>{article.title}</h3><p>{article.excerpt}</p><span>{article.author?.name} · {article.readingTimeMinutes} min read</span></Link>;
}
export default function ArticleDetailPage() {
  const { username = '', slug = '' } = useParams();
  const userId = useAppSelector(s => s.auth.user?._id);
  return <ArticleReader key={`${username}/${slug}:${userId ?? 'guest'}`} username={username} slug={slug} />;
}
function ArticleReader({ username, slug }: { username: string; slug: string }) {
  const location = useLocation(); const navigate = useNavigate(); const navigation = useNavigationType();
  const dispatch = useAppDispatch(); const user = useAppSelector(s => s.auth.user); const reducedMotion = useReducedMotionPreference();
  const { currentData: article, isLoading, error, refetch } = useArticleBySlugQuery({ username, slug, viewerId: user?._id ?? 'guest' });
  useArticleMetadata(article);
  const { currentData: related = [] } = useRelatedArticlesQuery(article?._id ?? '', { skip: !article?._id });
  const [incrementView] = useIncrementArticleViewMutation(); const [toggleLike, likeState] = useToggleLikeMutation();
  const [deleteArticle, deleteState] = useDeleteArticleMutation(); const [createHighlight, highlightState] = useCreateHighlightMutation();
  const [logoutUser] = useLogoutUserMutation();
  const [panel, setPanel] = useState<SupportPanel>('closed'); const [tab, setTab] = useState<NotebookTab>('notes');
  const [utility, setUtility] = useState<'closed' | 'navigation' | 'appearance' | 'more' | 'tools'>('closed');
  const [focus, setFocus] = useState(false); const previousPanel = useRef<SupportPanel>('closed');
  const [viewport, setViewport] = useState(window.innerWidth);
  const [selection, setSelection] = useState<{ passage: Passage; x: number; y: number } | null>(null);
  const [passage, setPassage] = useState<Passage | null>(null); const [noteIntent, setNoteIntent] = useState(0);
  const [auth, setAuth] = useState<string | null>(null); const [confirmDelete, setConfirmDelete] = useState(false);
  const [failedCover, setFailedCover] = useState(false); const [liked, setLiked] = useState(false); const [likes, setLikes] = useState(0);
  const bodyRef = useRef<HTMLDivElement | null>(null); const articleRef = useRef<HTMLElement | null>(null);
  const mutationLock = useRef(false);
  const activation = useRef(consumePendingArticleNavigation(slug));
  const continued = activation.current?.mode === 'continue' || (location.state as { articleNavMode?: string } | null)?.articleNavMode === 'continue';
  const appearance = useReaderAppearance();
  const width = { narrow: 620, comfortable: 700, wide: 820 }[appearance.value.readingWidth];
  const fontSize = { small: 17, medium: viewport < 640 ? 18 : 19, large: 21, 'extra-large': 24 }[appearance.value.fontSize];
  const docked = viewport >= width + 2 * ((panel === 'contents' ? 230 : 350) + 32);
  const dockRef = useScrollAwareDock(`${location.key}:${location.hash}:${focus}`, {
    suppressed: focus || (panel !== 'closed' && !docked) || utility !== 'closed' || Boolean(auth) || confirmDelete,
    pinned: false,
    reducedMotion,
    autoHide: true
  });
  const progress = useReaderProgress(article?._id, user?._id, bodyRef, continued);
  const notify = (title: string, tone: 'success' | 'error' | 'info' = 'info') => dispatch(pushToast({ title, tone }));
  const closeSurfaces = () => { setPanel('closed'); setUtility('closed'); setSelection(null); };
  const openPanel = (next: SupportPanel) => { setUtility('closed'); setSelection(null); setPanel(p => togglePanel(p, next)); };
  const openUtility = (next: typeof utility) => { setPanel('closed'); setSelection(null); setUtility(u => u === next ? 'closed' : next); };
  const authenticate = (action: string) => {
    if (user) return true;
    if (article) sessionStorage.setItem('upwrite.reader.pending', JSON.stringify({ article: article._id, passage, action, draft: sessionStorage.getItem(`upwrite.reader.draft:guest:${article._id}`) }));
    closeSurfaces(); setAuth(action); return false;
  };
  const openNotebook = (next: NotebookTab, quote: Passage | null = passage) => { setPassage(quote); setTab(next); setUtility('closed'); setPanel('notebook'); setSelection(null); };
  useEffect(() => { const resize = () => setViewport(window.innerWidth); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize); }, []);
  useEffect(() => { setLiked(Boolean(article?.viewerLiked)); setLikes(article?.stats?.likesCount ?? 0); }, [article?.viewerLiked, article?.stats?.likesCount]);
  useEffect(() => {
    if (!article) return;
    document.title = `${article.title} | Upwrite`;
    const key = `article-viewed-${article._id}`;
    if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, 'true'); void incrementView(article._id); }
  }, [article?._id, incrementView]);
  const resumedAction = useRef(false);
  useEffect(() => {
    if (!article || !user || resumedAction.current) return;
    const state = location.state as { resumeAction?: string; resumeContentId?: string } | null;
    if (state?.resumeContentId !== article._id || !state.resumeAction) return;
    resumedAction.current = true;
    const likeMarker = `upwrite.reader.resumedLike:${location.key}:${user._id}:${article._id}`;
    const shouldLike = state.resumeAction === 'like' && !article.viewerLiked && !sessionStorage.getItem(likeMarker);
    if (shouldLike) sessionStorage.setItem(likeMarker, 'true');
    if (shouldLike) void toggleLike({ contentType: 'article', contentId: article._id }).unwrap().then(r => { setLiked(r.liked); setLikes(r.likesCount ?? article.stats?.likesCount ?? 0); }).catch(() => notify('Could not like this article. Please retry.', 'error'));
    try {
      const pending = JSON.parse(sessionStorage.getItem('upwrite.reader.pending') ?? 'null');
      if (pending?.article === article._id && pending.action === state.resumeAction && ['note','highlight','ai','study'].includes(pending.action)) {
        sessionStorage.removeItem('upwrite.reader.pending');
        setPassage(pending.passage ?? null);
        if (pending.draft) sessionStorage.setItem(`upwrite.reader.draft:${user._id}:${article._id}`, pending.draft);
        setNoteIntent(n => n + 1);
        setTab(pending.action === 'study' ? 'study' : pending.action === 'ai' ? 'ai' : 'notes'); setPanel('notebook');
      }
    } catch { /* invalid recovery data */ }
  }, [article, user, location.state]);
  useEffect(() => {
    if (!article) return;
    let timer = 0;
    const update = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key === 'Escape') { setSelection(null); return; }
      if (event.target instanceof Element && event.target.closest('.reader-selection,.reader-surface')) return;
      clearTimeout(timer); timer = window.setTimeout(() => {
        const root = bodyRef.current; const selection = window.getSelection();
        const captured = root && capturePassage(root, selection, article.updatedAt);
        if (!captured || !selection?.rangeCount) return;
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        setSelection({ passage: captured, x: Math.max(8, Math.min(window.innerWidth - 300, rect.left)), y: rect.top > 155 ? rect.top - 64 : Math.min(window.innerHeight - 150, rect.bottom + 24) });
      }, 100);
    };
    const dismiss = () => setSelection(null);
    document.addEventListener('pointerup', update); document.addEventListener('keyup', update); window.addEventListener('scroll', dismiss, { passive: true });
    return () => { clearTimeout(timer); document.removeEventListener('pointerup', update); document.removeEventListener('keyup', update); window.removeEventListener('scroll', dismiss); };
  }, [article?._id, article?.updatedAt]);
  const captureSelection = () => {
    const captured = bodyRef.current && capturePassage(bodyRef.current, window.getSelection(), article?.updatedAt);
    if (captured) setPassage(captured); else notify('Select a passage in the article, then use Highlight, Add note or Ask AI.');
  };
  const saveHighlight = async (quote: Passage) => {
    if (!article || mutationLock.current) return;
    setPassage(quote);
    if (!user) { sessionStorage.setItem('upwrite.reader.pending', JSON.stringify({ article: article._id, passage: quote, action: 'highlight' })); closeSurfaces(); setAuth('highlight'); return; }
    mutationLock.current = true;
    try { await createHighlight({ article: article._id, ...quote }).unwrap(); setSelection(null); notify('Highlight saved', 'success'); }
    catch { notify('Could not save highlight. Select Highlight to retry.', 'error'); }
    finally { mutationLock.current = false; }
  };
  const like = async () => {
    if (!article || likeState.isLoading || !authenticate('like')) return;
    try { const result = await toggleLike({ contentType: 'article', contentId: article._id }).unwrap(); setLiked(result.liked); setLikes(result.likesCount ?? likes); }
    catch { notify('Could not update like. Please retry.', 'error'); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(window.location.href); notify('Link copied', 'success'); }
    catch { notify('Could not copy the link. Copy the address from your browser.', 'error'); }
  };
  const share = async () => {
    if (!article) return;
    closeSurfaces();
    if (navigator.share) { try { await navigator.share({ title: article.title, url: window.location.href }); return; } catch (e) { if (e instanceof DOMException && e.name === 'AbortError') return; } }
    setUtility('more');
  };
  const toggleFocus = () => {
    setUtility('closed'); setSelection(null);
    if (!focus) { previousPanel.current = panel; setPanel('closed'); setFocus(true); }
    else { setFocus(false); if (viewport >= width + 2 * ((previousPanel.current === 'contents' ? 230 : 350) + 32)) setPanel(previousPanel.current); }
  };
  const backHref = activation.current?.originPath ?? '/read';
  const tools = <><Button variant="ghost" aria-expanded={panel === 'contents'} onClick={() => openPanel('contents')}>Contents</Button><Button variant="ghost" aria-expanded={panel === 'notebook'} onClick={() => openPanel('notebook')}>Notebook</Button><Button variant="ghost" aria-label="Reading appearance" onClick={() => openUtility('appearance')}>Aa</Button><Button variant="ghost" aria-pressed={focus} onClick={toggleFocus}>{focus ? 'Exit focus' : 'Focus'}</Button></>;
  return <div className={`variant-x ${focus ? 'reader-focused' : ''}`} style={{ '--reader-width': `${width}px`, '--reader-size': `${fontSize}px`, '--reader-leading': appearance.value.lineSpacing ?? 1.7 } as CSSProperties}>
    <a className="reader-skip" href="#article-content">Skip to article</a>
    <header className="reader-header">
      <Link to={backHref} aria-label="Back to previous list" className="reader-back" onClick={e => { if (!isModifiedNavigationEvent(e) && (window.history.state?.idx ?? 0) > 0) { e.preventDefault(); navigate(-1); } }}><ArrowLeft size={19} /></Link>
      <Link to="/today" className="reader-brand">Upwrite<span aria-hidden="true">.</span></Link>
      {focus ? <div className="ml-auto flex gap-1"><Button variant="ghost" onClick={toggleFocus}>Exit focus</Button><Button variant="ghost" onClick={() => openUtility('tools')}>Reading tools</Button></div> : <><div className="reader-desktop-tools"><Button variant="ghost" aria-label="Open app navigation" onClick={() => openUtility('navigation')}>App navigation</Button>{tools.props.children.slice(0,3)}</div><div className="reader-header-end">{article ? <SaveToCollectionButton contentType="article" contentId={article._id} initialSaved={article.viewerSaved} /> : null}<div className="reader-desktop-focus"><Button variant="ghost" onClick={toggleFocus}>Focus</Button></div><Button size="icon" variant="ghost" aria-label="More article actions" onClick={() => openUtility('more')}><MoreHorizontal size={20} /></Button></div></>}
      <div className="reader-progress" aria-label={`Article scroll progress: ${progress.percent}%`}><span style={{ transform: `scaleX(${progress.percent / 100})` }} /></div>
    </header>
    {progress.resumed ? <div className="reader-resume-status" role="status">Resumed reading <Button size="sm" variant="ghost" onClick={progress.start}>Start from top</Button></div> : null}
    <main id="article-content" tabIndex={-1}>
      {isLoading ? <ArticleDetailSkeleton /> : error || !article ? <div className="reader-loading"><h1 className="text-2xl font-semibold">{error && 'status' in error && error.status === 404 ? 'Article not found' : error && 'status' in error && error.status === 403 ? 'This article is private' : 'Unable to load this article'}</h1><p className="my-4">It may have moved or may no longer be available.</p><Button onClick={() => void refetch()}>Retry</Button> <Link to="/read">Explore Read</Link></div> : <motion.article ref={articleRef} className="reader-article" initial={navigation === 'POP' || continued || location.hash ? false : { opacity: 0, y: reducedMotion ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? MOTION_DURATION.reducedFade : MOTION_DURATION.routeReveal, ease: MOTION_IN_OUT_EASE }} onAnimationComplete={() => { if (articleRef.current) articleRef.current.style.transform = 'none'; }}>
        <header className="reader-opening">{article.tags?.[0] ? <Link to={`/read?tag=${encodeURIComponent(article.tags[0])}`} className="reader-topic">{article.tags[0]}</Link> : null}<h1>{article.title}</h1>{article.excerpt?.trim() ? <p className="reader-excerpt">{article.excerpt}</p> : null}<div className="reader-meta"><Avatar name={article.author?.name} src={getImageSrc(article.author?.avatar)} /><div><Link to={`/profile/${article.author?.username}`}>{article.author?.name ?? article.author?.username}</Link><p><time dateTime={article.publishedAt ?? article.createdAt}>{formatDate(article.publishedAt ?? article.createdAt)}</time><span data-pref="reading-time"> · {article.readingTimeMinutes} min read</span></p></div></div>{getImageSrc(article.coverImage) && !failedCover ? <img className="reader-cover" src={getImageSrc(article.coverImage)} alt={`Cover for ${article.title}`} width={1400} height={700} onError={() => setFailedCover(true)} /> : null}</header>
        {progress.offer ? <div className="reader-resume" role="status">You have a saved reading position. {progress.offer ? <Button size="sm" variant="ghost" onClick={progress.resume}>Resume</Button> : null}<Button size="sm" variant="ghost" onClick={progress.start}>Start from top</Button></div> : null}
        <div ref={bodyRef} data-revision={article.updatedAt} className="article-body reading-prose" tabIndex={0} aria-label="Article text. Select a passage with keyboard or touch to access passage actions." aria-keyshortcuts="Alt+H Alt+N Alt+A" onKeyDown={event => {
          if (!event.altKey || !['h','n','a'].includes(event.key.toLowerCase())) return;
          const quote = bodyRef.current && capturePassage(bodyRef.current, window.getSelection(), article.updatedAt);
          if (!quote) return;
          event.preventDefault();
          if (event.key.toLowerCase() === 'h') void saveHighlight(quote);
          else { openNotebook(event.key.toLowerCase() === 'n' ? 'notes' : 'ai', quote); if (event.key.toLowerCase() === 'n') setNoteIntent(n => n + 1); }
        }}><ReaderMarkdown content={article.content ?? ''} /></div>
        {article.tags && article.tags.length > 1 ? <div className="reader-tags">{article.tags.slice(1).map(tag => <Link key={tag} to={`/read?tag=${encodeURIComponent(tag)}`}>#{tag}</Link>)}</div> : null}
        <div className="reader-ending-actions"><Button variant="ghost" disabled={likeState.isLoading} aria-pressed={liked} onClick={() => void like()}><Heart size={18} fill={liked ? 'currentColor' : 'none'} />{liked ? 'Liked' : 'Like'} <span data-pref="like-counts">{likes}</span></Button><SaveToCollectionButton contentType="article" contentId={article._id} initialSaved={article.viewerSaved} /><Button variant="ghost" onClick={() => void share()}><Share2 size={18} />Share</Button></div>
        <section className="reader-author" aria-label="About the author"><Avatar name={article.author?.name} src={getImageSrc(article.author?.avatar)} /><div className="min-w-0 flex-1"><p className="font-semibold">{article.author?.name}</p>{article.author?.bio ? <p>{article.author.bio}</p> : null}<Link to={`/profile/${article.author?.username}`}>View profile</Link></div>{article.author?._id && article.author._id !== user?._id ? <FollowButton userId={article.author._id} username={article.author.username} following={article.author.isFollowing} /> : null}</section>
        <div id="discussion" className="scroll-mt-24"><CommentThread contentType="article" contentId={article._id} /></div>
        {related.length ? <section className="reader-related"><h2>Related reading</h2>{related.map(item => <RelatedRow key={item._id} article={item} />)}</section> : null}
      </motion.article>}
    </main>
    {!focus ? <nav ref={dockRef} data-scroll-dock className="reader-bottom" aria-label="Reading tools">{tools}</nav> : null}
    <ReaderSurface open={panel === 'contents'} modal={!docked} side="left" title="Contents" close={() => setPanel('closed')}>{article ? <ArticleOutline content={article.content ?? ''} onSelect={() => { if (!docked) setPanel('closed'); }} /> : <p>Contents will be available when the article loads.</p>}</ReaderSurface>
    <ReaderSurface open={panel === 'notebook'} workspace modal={!docked} title="Notebook" close={() => setPanel('closed')}>{article ? <ReaderNotebook key={`${article._id}:${user?._id ?? 'guest'}`} article={article} userId={user?._id} tab={tab} setTab={setTab} passage={passage} setPassage={setPassage} bodyRef={bodyRef} authenticate={authenticate} captureSelection={captureSelection} noteIntent={noteIntent} /> : <p>Notebook will be available when the article loads.</p>}</ReaderSurface>
    <ReaderSurface open={utility !== 'closed'} modal title={utility === 'navigation' ? 'App navigation' : utility === 'appearance' ? 'Reading appearance' : utility === 'tools' ? 'Reading tools' : 'More'} close={() => setUtility('closed')}>
      {utility === 'navigation' ? <nav className="reader-app-links" aria-label="App navigation">{[['Today','/today'],['Read','/read'],['Library','/library'],['Learn','/learn'],['Studio','/studio'],['Settings','/settings/profile'],['Search','/search'],['Write','/write'],['Notifications','/notifications'],[user ? 'Your profile' : 'Sign in', user ? `/profile/${user.username}` : '/login']].map(([label,href]) => <Link key={label} to={href}>{label}</Link>)}{user ? <Button variant="ghost" onClick={() => { void logoutUser().unwrap().then(() => { dispatch(logout()); closeSurfaces(); }).catch(() => notify('Could not sign out. Please retry.', 'error')); }}>Sign out</Button> : null}</nav> : null}
      {utility === 'appearance' ? <div className="reader-appearance"><p className="text-sm text-content-muted">Applied immediately. {user ? 'Synced to your account.' : 'Saved on this device.'}</p><label>Text size<select value={appearance.value.fontSize} onChange={e => appearance.patch({ fontSize: e.target.value as AppearanceSettings['fontSize'] })}>{['small','medium','large','extra-large'].map(v => <option key={v}>{v}</option>)}</select></label>{viewport > 640 ? <label>Reading width<select value={appearance.value.readingWidth} onChange={e => appearance.patch({ readingWidth: e.target.value as AppearanceSettings['readingWidth'] })}>{['narrow','comfortable','wide'].map(v => <option key={v}>{v}</option>)}</select></label> : null}<label>Theme<select value={appearance.theme} onChange={e => appearance.patch({ theme: e.target.value as AppearanceSettings['theme'] })}>{['system','light','dark'].map(v => <option key={v}>{v}</option>)}</select></label><label>Line spacing ({appearance.value.lineSpacing ?? 1.7})<input type="range" min="1.4" max="2.2" step="0.1" value={appearance.value.lineSpacing ?? 1.7} onChange={e => appearance.patch({ lineSpacing: Number(e.target.value) })} /></label><Button variant="secondary" onClick={() => appearance.patch({ ...readerDefaults, theme: 'system' })}>Reset reading appearance</Button></div> : null}
      {utility === 'tools' ? <div className="reader-tools-menu">{tools}<Button variant="ghost" onClick={() => openUtility('navigation')}>App navigation</Button></div> : null}
      {utility === 'more' ? <div className="reader-tools-menu"><Button variant="ghost" onClick={() => openUtility('navigation')}>App navigation</Button><Button variant="ghost" onClick={() => void share()}>Share</Button><Button variant="ghost" onClick={() => void copy()}>Copy link</Button><a href="#discussion" onClick={() => { closeSurfaces(); requestAnimationFrame(() => document.getElementById('discussion')?.scrollIntoView({ behavior: 'instant' })); }}>Jump to Discussion</a><Button variant="ghost" onClick={() => { openNotebook('notes'); captureSelection(); }}>Passage actions</Button>{article && user?._id === article.author?._id ? <div className="reader-owner"><p>Owner actions</p><Link to={`/write/${article._id}`}>Edit article</Link><Button variant="danger" onClick={() => { setUtility('closed'); setConfirmDelete(true); }}>Delete article</Button></div> : null}</div> : null}
    </ReaderSurface>
    {selection && panel === 'closed' && utility === 'closed' ? <div role="toolbar" aria-label="Selected passage actions" className="reader-selection" style={{ left: selection.x, top: selection.y }} onPointerDown={e => e.preventDefault()}><Button size="sm" variant="ghost" disabled={highlightState.isLoading} onClick={() => void saveHighlight(selection.passage)}>Highlight</Button><Button size="sm" variant="ghost" onClick={() => { openNotebook('notes', selection.passage); setNoteIntent(n => n + 1); }}>Add note</Button><Button size="sm" variant="ghost" onClick={() => openNotebook('ai', selection.passage)}>Ask AI</Button><Button size="sm" variant="ghost" onClick={() => openNotebook('ai', selection.passage)}>More</Button><button aria-label="Dismiss passage actions" onClick={() => setSelection(null)}>×</button></div> : null}
    <ReaderSurface open={confirmDelete} modal title="Delete article?" close={() => setConfirmDelete(false)}><p>This permanently deletes the article.</p><Button variant="danger" disabled={deleteState.isLoading} onClick={() => { if (!article || deleteState.isLoading) return; void deleteArticle(article._id).unwrap().then(() => navigate('/studio', { replace: true })).catch(() => notify('Could not delete article. Please retry.', 'error')); }}>{deleteState.isLoading ? 'Deleting…' : 'Delete article'}</Button></ReaderSurface>
    <AuthPrompt open={Boolean(auth)} message="Sign in to use your private reading tools." action={auth ?? undefined} contentType="article" contentId={article?._id} onClose={() => setAuth(null)} />
  </div>;
}
