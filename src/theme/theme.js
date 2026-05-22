import { StyleSheet } from 'react-native';

export const getTheme = (isDark) => ({
  bg: isDark ? '#1A1A1A' : '#F5F5F5',
  card: isDark ? '#2A2A2A' : '#FFFFFF',
  blue: '#3B9EFF',
  purple: '#7B5CF5',
  white: isDark ? '#FFFFFF' : '#000000',
  gray: '#888888',
  sep: isDark ? '#444444' : '#DDDDDD',
  reviewCard: isDark ? '#3A4A5C' : '#E3F2FD',
  cardBtnBg: isDark ? '#ffffff22' : '#00000011',
  favIcon: isDark ? '#ffffff55' : '#00000055',
});

export const getStyles = (C) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8 },
  hBtn: { padding: 8 },
  hIcon: { color: C.white, fontSize: 30 },
  hTitle: { color: C.white, fontSize: 18, fontWeight: 'bold', paddingLeft: 8 },

  // Workspace pill
  pill: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 30, borderWidth: 1, borderColor: '#444',
    paddingHorizontal: 16, paddingVertical: 8,
    marginHorizontal: 16, marginBottom: 12,
  },
  pillText: { color: C.blue, flex: 1, fontWeight: '500' },
  pillIconWrapper: { 
    backgroundColor: C.cardBtnBg, 
    borderRadius: 12, 
    width: 24, 
    height: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 8 
  },
  pillUpload: { color: C.blue, fontSize: 10 },

  // Action row
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 16 },
  actionBtn: { color: C.blue, fontWeight: 'bold', fontSize: 14 },

  // Daily goal
  dailyGoal: { backgroundColor: C.card, borderRadius: 8, padding: 12, marginHorizontal: 16, marginBottom: 16 },
  dailyGoalText: { color: C.white, marginBottom: 8, fontSize: 13 },

  // Progress bar
  pbBg: { height: 4, backgroundColor: C.sep, borderRadius: 2, overflow: 'hidden' },
  pbFill: { height: 4, borderRadius: 2 },

  // Deck item
  deckItem: {
    backgroundColor: C.card, borderRadius: 12,
    padding: 14, marginHorizontal: 16, marginBottom: 12,
  },
  deckName: { color: C.white, fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  deckSub: { color: C.gray, fontSize: 12, marginBottom: 8 },
  deckItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  deckMenuBtn: { paddingHorizontal: 8, paddingBottom: 8, marginRight: -8 },
  deckMenuIcon: { color: C.gray, fontSize: 20, fontWeight: 'bold' },
  deckActions: { flexDirection: 'row', marginTop: 10, gap: 16 },
  deckActionBtn: { color: C.blue, fontWeight: 'bold', fontSize: 13 },

  // Context Menu Modal
  contextOverlay: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', alignItems: 'center' },
  contextMenu: { backgroundColor: C.card, borderRadius: 12, paddingVertical: 8, width: 250, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  contextMenuItem: { paddingVertical: 12, paddingHorizontal: 20 },
  contextMenuText: { color: C.white, fontSize: 16 },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: C.bg, gap: 10 },
  footerOut: { borderRadius: 30, borderWidth: 1.5, borderColor: C.blue, paddingVertical: 14, alignItems: 'center' },
  footerOutText: { color: C.blue, fontWeight: 'bold', fontSize: 14 },
  footerFill: { borderRadius: 30, backgroundColor: C.blue, paddingVertical: 14, alignItems: 'center' },
  footerFillText: { color: C.white, fontWeight: 'bold', fontSize: 14 },

  // Badge
  badge: { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start' },
  badgeText: { color: C.white, fontSize: 10, fontWeight: 'bold' },

  // Modal / Menu
  modalOverlay: { flex: 1, flexDirection: 'row' },
  menuContainer: { width: '78%', height: '100%', backgroundColor: C.card },
  menuOverRight: { flex: 1, backgroundColor: '#00000066' },
  menuHeader: { padding: 20, paddingTop: 44 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#ff009d',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  avatarText: { color: C.white, fontSize: 22, fontWeight: 'bold' },
  menuName: { color: C.white, fontWeight: 'bold', fontSize: 16, marginTop: 6 },
  menuEmail: { color: '#ffffffaa', fontSize: 12, marginTop: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  menuItemIcon: { width: 22, fontSize: 16 },
  menuItemText: { color: C.white, fontSize: 14, marginLeft: 12 },
  menuSep: { height: 1, backgroundColor: C.sep, marginVertical: 4 },
  menuVersion: { color: C.gray, fontSize: 12, textAlign: 'center', padding: 16 },

  // PracticePicker
  modoItem: {
    backgroundColor: C.card, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center',
    padding: 14, marginBottom: 10,
  },
  modoIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#3B9EFF22',
    justifyContent: 'center', alignItems: 'center',
  },
  modoLabel: { color: C.white, fontWeight: 'bold', fontSize: 15 },
  modoDesc: { color: C.gray, fontSize: 12, marginTop: 2 },

  // ReviewScreen — card
  reviewCard: { flex: 1, backgroundColor: C.reviewCard, borderRadius: 16, margin: 16 },
  cardContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  cardFront: { color: C.white, fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  cardBack: { color: C.white, fontSize: 18, textAlign: 'center' },
  cardHint: { color: '#ffffff44', textAlign: 'center', paddingBottom: 60, fontSize: 12 },
  favBtn: { position: 'absolute', top: 14, left: 14, zIndex: 1 },
  replayBtn: {
    position: 'absolute', bottom: 14, right: 56,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.blue,
    justifyContent: 'center', alignItems: 'center',
  },
  nextCardBtn: {
    position: 'absolute', bottom: 14, right: 14,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.cardBtnBg,
    justifyContent: 'center', alignItems: 'center',
  },
  progressText: { color: C.gray, fontSize: 12, paddingHorizontal: 8 },
  ratingRow: { flexDirection: 'row', padding: 16, gap: 8 },
  ratingBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  ratingBtnText: { color: C.white, fontWeight: 'bold', fontSize: 14 },

  // Done screen
  doneScreen: { justifyContent: 'center', alignItems: 'center' },
  doneTitle: { color: C.white, fontSize: 28, fontWeight: 'bold', marginTop: 16, marginBottom: 24 },
  ratingsRow: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  ratingChip: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  ratingChipText: { color: C.white, fontWeight: 'bold' },
  backBtn: { backgroundColor: C.blue, borderRadius: 30, paddingHorizontal: 40, paddingVertical: 14 },
  backBtnText: { color: C.white, fontWeight: 'bold', fontSize: 16 },

  // WorkspaceScreen
  wsHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: C.card },
  wsClose: { color: C.white, fontSize: 22 },
  wsItem: { backgroundColor: C.card, borderRadius: 12, marginHorizontal: 16, marginBottom: 8 },
  wsItemRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  wsItemActive: { backgroundColor: '#00897B' },
  wsBar: { width: 4, height: 28, borderRadius: 2, marginRight: 14 },
  wsItemText: { color: C.white, fontWeight: '600', fontSize: 15 },
  wsEmpty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  wsEmptyTitle: { color: C.gray, fontSize: 14 },
  wsEmptyHint: { color: '#666', fontSize: 12, marginTop: 4 },
  wsFab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.blue,
    justifyContent: 'center', alignItems: 'center',
  },
  wsFabText: { color: C.white, fontSize: 28, lineHeight: 56, textAlign: 'center' },
  wsModalOverlay: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', alignItems: 'center' },
  wsModalBox: { backgroundColor: C.card, borderRadius: 16, padding: 24, marginHorizontal: 32, width: '85%' },
  wsModalTitle: { color: C.white, fontWeight: 'bold', fontSize: 16, marginBottom: 16 },
  wsInput: { color: C.white, backgroundColor: C.bg, borderRadius: 8, padding: 12, fontSize: 15 },
  wsModalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16, alignItems: 'center' },
  wsModalCancel: { color: C.gray, fontSize: 14 },
  wsModalConfirm: { backgroundColor: C.blue, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  wsModalConfirmText: { color: C.white, fontWeight: 'bold', fontSize: 14 },

  // DeckDetailsScreen
  ddHeader: { backgroundColor: C.bg, paddingTop: 8 },
  ddHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8 },
  ddHeaderIcons: { flexDirection: 'row' },
  ddTabs: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  ddTabActive: { borderBottomWidth: 3, borderBottomColor: C.blue, paddingHorizontal: 16, paddingVertical: 8 },
  ddTabText: { color: C.blue, fontWeight: 'bold', fontSize: 15 },
  ddListContent: { padding: 16, paddingBottom: 120 },
  ddCard: { flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 16, minHeight: 140, justifyContent: 'space-between', marginBottom: 12 },
  ddCardFront: { color: C.white, fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  ddCardBack: { color: C.gray, fontSize: 14 },
  ddCardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, borderTopWidth: 1, borderTopColor: C.sep, paddingTop: 12 },
  ddCardIcon: { color: C.gray, fontSize: 18 },
  ddFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 16, backgroundColor: C.bg, gap: 12, borderTopWidth: 1, borderTopColor: C.sep },
  ddFooterBtn: { flex: 1, backgroundColor: C.blue, borderRadius: 30, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  ddFooterBtnText: { color: C.white, fontWeight: 'bold', fontSize: 13 },
  ddFab: {
    position: 'absolute', bottom: 90, right: 16,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#FF9800',
    justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4
  },
  ddFabText: { fontSize: 24 },
});
