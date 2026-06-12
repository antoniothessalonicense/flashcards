CREATE TABLE IF NOT EXISTS `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`set_id` text NOT NULL,
	`front` text NOT NULL,
	`back` text NOT NULL,
	`next_review_date` integer DEFAULT 0 NOT NULL,
	`ease_factor` integer DEFAULT 250 NOT NULL,
	`difficultyStatus` text DEFAULT 'new' NOT NULL,
	FOREIGN KEY (`set_id`) REFERENCES `sets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_cards_next_review_date` ON `cards` (`next_review_date`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_cards_set_id` ON `cards` (`set_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `ciclo_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`limiteDiarioTotal` integer DEFAULT 0 NOT NULL,
	`limiteAtivo` integer DEFAULT 0 NOT NULL,
	`cardsPorConjuntoObrigatorio` integer DEFAULT 40 NOT NULL,
	`qtdConjuntosAtrasados` integer DEFAULT 5 NOT NULL,
	`cardsPorConjuntoAtrasado` integer DEFAULT 20 NOT NULL,
	`cardsErrosAnteriores` integer DEFAULT 20 NOT NULL,
	`cardsImportantes` integer DEFAULT 20 NOT NULL,
	`qtdConjuntosFixosPorCiclo` integer DEFAULT 1 NOT NULL,
	`cardsPorConjuntoFixo` integer DEFAULT 20 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sets` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`frontLanguage` text DEFAULT 'pt-BR' NOT NULL,
	`backLanguage` text DEFAULT 'en-US' NOT NULL,
	`next_review_date` integer DEFAULT 0 NOT NULL,
	`totalReviews` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_sets_next_review_date` ON `sets` (`next_review_date`);