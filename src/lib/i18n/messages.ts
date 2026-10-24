// Translated UI strings, keyed by the same language codes as
// src/lib/languages.ts. Deliberately NOT exhaustive — see MessageKey for
// exactly which surfaces are translated so far (currently: the persistent
// nav bar and the Settings list). Anything not covered here still renders
// in English everywhere, by design — see useT() in language-context.tsx for
// the fallback behavior.
export type MessageKey =
  | "nav.dashboard"
  | "nav.analytics"
  | "nav.home"
  | "nav.activities"
  | "nav.settings"
  | "nav.memberships"
  | "membership.codeRenderError"
  | "membership.editTitle"
  | "membership.addCard"
  | "membership.nameLabel"
  | "membership.namePlaceholder"
  | "membership.codeLabel"
  | "membership.scanInstead"
  | "membership.codePlaceholder"
  | "membership.formatLabel"
  | "membership.formatQr"
  | "membership.formatCode128"
  | "membership.formatEan13"
  | "membership.formatUpc"
  | "membership.colorLabel"
  | "membership.iconLabel"
  | "membership.notesLabel"
  | "membership.notesPlaceholder"
  | "membership.tabCode"
  | "membership.tabFields"
  | "membership.scanUnsupported"
  | "membership.scanTitle"
  | "membership.scanPhotoError"
  | "membership.cropTitle"
  | "membership.cropReset"
  | "membership.cropLoadError"
  | "membership.cropSaveError"
  | "membership.cropHintFreeform"
  | "membership.cropHintFixed"
  | "membership.choosePhoto"
  | "membership.decodingPhoto"
  | "membership.formatPdf417"
  | "membership.formatAztec"
  | "membership.previewLabel"
  | "membership.templateGeneric"
  | "membership.templateStoreCard"
  | "membership.templateCoupon"
  | "membership.templateEventTicket"
  | "membership.templateBoardingPass"
  | "membership.templateGiftCard"
  | "membership.templateTransitPass"
  | "membership.fieldPointsBalance"
  | "membership.fieldPointsBalancePlaceholder"
  | "membership.fieldMemberSince"
  | "membership.fieldMemberSincePlaceholder"
  | "membership.fieldDiscount"
  | "membership.fieldDiscountPlaceholder"
  | "membership.fieldExpiry"
  | "membership.fieldExpiryPlaceholder"
  | "membership.fieldEventDate"
  | "membership.fieldEventDatePlaceholder"
  | "membership.fieldVenue"
  | "membership.fieldVenuePlaceholder"
  | "membership.fieldSeat"
  | "membership.fieldSeatPlaceholder"
  | "membership.fieldBalance"
  | "membership.fieldBalancePlaceholder"
  | "membership.fieldRidesRemaining"
  | "membership.fieldRidesRemainingPlaceholder"
  | "membership.fieldFrom"
  | "membership.fieldFromPlaceholder"
  | "membership.fieldTo"
  | "membership.fieldToPlaceholder"
  | "membership.fieldGate"
  | "membership.fieldGatePlaceholder"
  | "membership.fieldBoardingTime"
  | "membership.fieldBoardingTimePlaceholder"
  | "membership.fieldMemberId"
  | "membership.fieldMemberIdPlaceholder"
  | "membership.kindLabel"
  | "membership.editorGuided"
  | "membership.editorCustom"
  | "membership.zoneHeader"
  | "membership.zonePrimary"
  | "membership.zoneSecondary"
  | "membership.zoneAuxiliary"
  | "membership.availableFields"
  | "membership.tapFieldHint"
  | "membership.addFieldHere"
  | "membership.newFieldLabel"
  | "membership.newFieldPlaceholder"
  | "membership.newFieldAdd"
  | "membership.newFieldLimitReached"
  | "membership.removeCustomField"
  | "membership.hideFieldLabel"
  | "membership.showLogoOnCardLabel"
  | "membership.lockLogoLabel"
  | "membership.lockLogoDesc"
  | "membership.lockBannerLabel"
  | "membership.lockBannerDesc"
  | "membership.lockFieldsLabel"
  | "membership.lockFieldsDesc"
  | "membership.showNameOnCardLabel"
  | "membership.showCodeTextLabel"
  | "membership.premadePassesLabel"
  | "membership.uploadPassTemplateDesc"
  | "membership.viewPassGuidelinesLink"
  | "passGuidelines.title"
  | "passGuidelines.intro"
  | "passGuidelines.logoHeightLabel"
  | "passGuidelines.logoWidthLabel"
  | "passGuidelines.bannerHeightLabel"
  | "passGuidelines.cornerRadiusLabel"
  | "passGuidelines.shapeHeading"
  | "passGuidelines.shapeBody"
  | "passGuidelines.assetsHeading"
  | "passGuidelines.assetsBody"
  | "passGuidelines.layoutHeading"
  | "passGuidelines.layoutBody"
  | "passGuidelines.kindCategoryHeading"
  | "passGuidelines.kindCategoryBody"
  | "passGuidelines.colorHeading"
  | "passGuidelines.colorBody"
  | "passGuidelines.checklistHeading"
  | "passGuidelines.checklistBody"
  | "membership.passTemplateReviewTitle"
  | "membership.passTemplateCategoryLabel"
  | "membership.passCategoryAirline"
  | "membership.passCategoryHotel"
  | "membership.passCategoryRetail"
  | "membership.passCategoryDining"
  | "membership.passCategoryTransit"
  | "membership.passCategoryEntertainment"
  | "membership.passCategoryOther"
  | "membership.entryTitle"
  | "membership.entryNewPass"
  | "membership.fileImportUnsupported"
  | "membership.editorTitle"
  | "nav.wallet"
  | "wallet.tabAccounts"
  | "wallet.tabCards"
  | "wallet.tabPasses"
  | "wallet.tabMemberships"
  | "wallet.cardsSubtitle"
  | "wallet.cardsEmptyTitle"
  | "wallet.cardsEmptyDesc"
  | "wallet.addCard"
  | "wallet.editCard"
  | "wallet.addPass"
  | "wallet.editPass"
  | "wallet.labelLabel"
  | "wallet.labelPlaceholder"
  | "wallet.networkLabel"
  | "wallet.networkVisa"
  | "wallet.networkMastercard"
  | "wallet.networkAmex"
  | "wallet.networkDiscover"
  | "wallet.networkOther"
  | "wallet.networkJcb"
  | "wallet.networkUnionPay"
  | "wallet.networkApplePay"
  | "wallet.last4Label"
  | "wallet.last4Hint"
  | "wallet.holderLabel"
  | "wallet.holderPlaceholder"
  | "wallet.expiryLabel"
  | "wallet.expiryMonthLabel"
  | "wallet.expiryYearLabel"
  | "wallet.passesSubtitle"
  | "wallet.entryTitle"
  | "wallet.entryAccountDesc"
  | "wallet.entryCardDesc"
  | "wallet.entryPassDesc"
  | "wallet.entryMembershipDesc"
  | "wallet.entryWalletDesc"
  | "wallet.entryPassCombinedDesc"
  | "wallet.kindAccountLabel"
  | "wallet.kindCardLabel"
  | "wallet.manageAccounts"
  | "wallet.stackEmptyTitle"
  | "wallet.stackEmptyDesc"
  | "color.custom"
  | "color.hex"
  | "color.rgb"
  | "color.cmyk"
  | "color.eyedropper"
  | "background.plain"
  | "background.patternDiagonal"
  | "background.patternRadialGlow"
  | "background.patternWave"
  | "background.patternDots"
  | "background.patternStripes"
  | "background.patternTriangles"
  | "background.patternGrid"
  | "background.patternSheen"
  | "background.patternTopographic"
  | "background.patternConfetti"
  | "background.patternDiagonalSplit"
  | "background.patternRibbonFold"
  | "background.patternLoopKnot"
  | "background.patternSpiralCoil"
  | "background.patternRadialBurst"
  | "background.patternColorBlocks"
  | "background.patternBrushedMetal"
  | "background.patternGuilloche"
  | "background.patternCarbonFiber"
  | "background.patternConcentricRings"
  | "background.patternHoloWave"
  | "background.patternMicroEmboss"
  | "background.patternScallopWave"
  | "background.patternPetalBloom"
  | "background.patternFloatingSquares"
  | "background.patternOvalCluster"
  | "background.patternFragmentShards"
  | "background.patternInkBlob"
  | "background.patternMarbleSwirl"
  | "background.patternSpeckleSplash"
  | "background.patternAuroraHalo"
  | "background.patternCircuitMaze"
  | "background.patternNeonRibbon"
  | "background.patternPrismShard"
  | "background.patternBannerFold"
  | "background.patternWavyLines"
  | "background.patternTearDrop"
  | "background.patternChevronBolt"
  | "background.patternCosmicStreak"
  | "background.patternDiagonalGrain"
  | "background.patternLiquidRibbon"
  | "background.patternHalfMoonGlow"
  | "background.patternInkSplatter"
  | "background.patternDiamondLattice"
  | "background.patternSunburstRays"
  | "background.patternZigzagPulse"
  | "background.patternHexGrid"
  | "background.patternGemFacet"
  | "background.patternCloudDrift"
  | "background.patternArcBands"
  | "background.patternPixelMosaic"
  | "background.patternFlameGradient"
  | "background.patternCurvedWing"
  | "background.patternSunFan"
  | "background.patternArrowGlint"
  | "background.patternDotFan"
  | "background.colorSlot1"
  | "background.colorSlot2"
  | "background.colorSlot3"
  | "background.scanCard"
  | "background.editColors"
  | "background.colorsLockedDesc"
  | "background.colorsLockedByTemplateDesc"
  | "background.scanTitle"
  | "background.scanHint"
  | "background.scanLoadError"
  | "background.takePhoto"
  | "background.choosePhoto"
  | "background.adjustTitle"
  | "background.adjustHint"
  | "background.resetGuide"
  | "background.useThisArea"
  | "background.resultTitle"
  | "background.extractedColors"
  | "background.chooseLook"
  | "background.useThisLook"
  | "background.back"
  | "background.useDirectTitle"
  | "background.useDirectHint"
  | "background.useThisPhoto"
  | "background.aiGenerateTitle"
  | "background.aiGenerateHint"
  | "background.generatePattern"
  | "background.generating"
  | "background.regenerate"
  | "background.useThisPattern"
  | "background.aiGenerateError"
  | "background.textColorLabel"
  | "wallet.iconColorLabel"
  | "wallet.iconColorDesc"
  | "wallet.iconColorUseOriginal"
  | "wallet.iconColorOriginalActive"
  | "wallet.iconColorCustomize"
  | "background.textColorAuto"
  | "membership.addLogo"
  | "membership.addBanner"
  | "membership.removeImage"
  | "membership.typeItInstead"
  | "membership.title"
  | "membership.subtitle"
  | "membership.emptyTitle"
  | "membership.emptyDesc"
  | "membership.couldNotDelete"
  | "membership.noCardSelected"
  | "membership.noCardSelectedDesc"
  | "nav.add"
  | "settings.section.appSettings"
  | "settings.section.records"
  | "settings.section.organize"
  | "settings.section.data"
  | "settings.section.social"
  | "settings.section.display"
  | "settings.section.tools"
  | "settings.section.ai"
  | "settings.aiUsage"
  | "ai.usageTitle"
  | "ai.usageTodayLabel"
  | "ai.usageDescription"
  | "ai.modelsTitle"
  | "ai.modelsDescription"
  | "ai.fallbackHint"
  | "ai.fallbackExplainer"
  | "ai.featureScan"
  | "ai.featureVoice"
  | "ai.featureAssistant"
  | "ai.featurePattern"
  | "settings.codeScanner"
  | "settings.currencyConverter"
  | "settings.discountCalculator"
  | "settings.loanCalculator"
  | "codeScanner.title"
  | "codeScanner.description"
  | "codeScanner.scanButton"
  | "codeScanner.scanAnother"
  | "codeScanner.copy"
  | "codeScanner.copied"
  | "currencyConverter.title"
  | "currencyConverter.amountLabel"
  | "currencyConverter.fromLabel"
  | "currencyConverter.toLabel"
  | "currencyConverter.swap"
  | "currencyConverter.converting"
  | "currencyConverter.enterAmount"
  | "currencyConverter.error"
  | "discountCalculator.title"
  | "discountCalculator.modeDiscount"
  | "discountCalculator.modeTip"
  | "discountCalculator.priceLabel"
  | "discountCalculator.billLabel"
  | "discountCalculator.discountPercentLabel"
  | "discountCalculator.tipPercentLabel"
  | "discountCalculator.splitLabel"
  | "discountCalculator.enterValues"
  | "discountCalculator.youSave"
  | "discountCalculator.finalPrice"
  | "discountCalculator.tipAmount"
  | "discountCalculator.total"
  | "discountCalculator.perPerson"
  | "loanCalculator.title"
  | "loanCalculator.principalLabel"
  | "loanCalculator.rateLabel"
  | "loanCalculator.monthsLabel"
  | "loanCalculator.enterValues"
  | "loanCalculator.monthlyPayment"
  | "loanCalculator.totalPaid"
  | "loanCalculator.totalInterest"
  | "loanCalculator.disclaimer"
  | "settings.section.support"
  | "settings.section.admin"
  | "settings.account"
  | "settings.permissions"
  | "settings.manageCategories"
  | "settings.manageTags"
  | "settings.vendors"
  | "settings.activities"
  | "settings.wallets"
  | "settings.friends"
  | "settings.challenges"
  | "settings.splitBills"
  | "settings.loans"
  | "settings.assistant"
  | "assistant.title"
  | "assistant.description"
  | "assistant.placeholder"
  | "ai.modelUsed"
  | "ai.answeredBy"
  | "assistant.ask"
  | "reports.title"
  | "reports.description"
  | "reports.exporting"
  | "reports.download"
  | "settings.backup"
  | "settings.codeGenerator"
  | "codeGenerator.title"
  | "codeGenerator.inputLabel"
  | "codeGenerator.inputDescription"
  | "codeGenerator.inputPlaceholder"
  | "codeGenerator.previewLabel"
  | "codeGenerator.emptyHint"
  | "codeGenerator.downloadLabel"
  | "codeGenerator.downloadAs"
  | "membership.codeLinkHint"
  | "backup.title"
  | "backup.export.title"
  | "backup.export.description"
  | "backup.export.passphrasePlaceholder"
  | "backup.export.confirmPlaceholder"
  | "backup.export.button"
  | "backup.export.exporting"
  | "backup.export.done"
  | "backup.export.tooShort"
  | "backup.export.mismatch"
  | "backup.export.failed"
  | "backup.import.title"
  | "backup.import.description"
  | "backup.import.passphrasePlaceholder"
  | "backup.import.button"
  | "backup.import.importing"
  | "backup.import.notABackup"
  | "backup.import.failed"
  | "backup.import.resultPrefix"
  | "backup.import.skippedLabel"
  | "settings.appLock"
  | "appLock.title"
  | "appLock.description"
  | "appLock.unsupported"
  | "appLock.loading"
  | "appLock.toggleLabel"
  | "appLock.toggleHint"
  | "appLock.devicesTitle"
  | "appLock.noDevices"
  | "appLock.unnamedDevice"
  | "appLock.remove"
  | "appLock.enrolling"
  | "appLock.addDevice"
  | "appLock.enrollFailed"
  | "appLock.toggleFailed"
  | "appLock.removeFailed"
  | "appLock.gate.title"
  | "appLock.gate.description"
  | "appLock.gate.unlock"
  | "appLock.gate.unlocking"
  | "appLock.gate.failed"
  | "appLock.gate.signOut"
  | "offline.banner.offline"
  | "offline.banner.offlineQueued"
  | "offline.banner.syncing"
  | "offline.banner.failed"
  | "offline.banner.synced"
  | "appLock.pin.title"
  | "appLock.pin.description"
  | "appLock.pin.set"
  | "appLock.pin.change"
  | "appLock.pin.newPlaceholder"
  | "appLock.pin.confirmPlaceholder"
  | "appLock.pin.save"
  | "appLock.pin.saving"
  | "appLock.pin.cancel"
  | "appLock.pin.invalid"
  | "appLock.pin.mismatch"
  | "appLock.pin.saveFailed"
  | "appLock.pin.removeFailed"
  | "appLock.gate.pinPlaceholder"
  | "appLock.gate.pinFailed"
  | "appLock.gate.usePin"
  | "appLock.gate.useBiometric"
  | "appLock.timeout.label"
  | "appLock.timeout.hint"
  | "appLock.timeout.immediately"
  | "appLock.timeout.1min"
  | "appLock.timeout.5min"
  | "appLock.timeout.15min"
  | "appLock.timeout.1hour"
  | "appLock.timeout.saveFailed"
  | "settings.referFriend"
  | "refer.title"
  | "refer.subtitle"
  | "refer.qrCaption"
  | "refer.copy"
  | "refer.copied"
  | "refer.share"
  | "refer.shareText"
  | "refer.embedTitle"
  | "refer.embedHint"
  | "refer.embedCopy"
  | "friends.owesYou"
  | "friends.youOwe"
  | "recurring.suggestions.title"
  | "recurring.suggestions.hint"
  | "recurring.suggestions.seenTimes"
  | "recurring.suggestions.dismiss"
  | "recurring.suggestions.add"
  | "settings.pendingChanges"
  | "pendingChanges.title"
  | "pendingChanges.description"
  | "pendingChanges.empty"
  | "pendingChanges.pendingTitle"
  | "pendingChanges.syncNow"
  | "pendingChanges.failedTitle"
  | "pendingChanges.retry"
  | "pendingChanges.discard"
  | "split.recurring.title"
  | "split.recurring.add"
  | "split.recurring.titlePlaceholder"
  | "split.recurring.save"
  | "split.recurring.needParticipant"
  | "split.recurring.saveFailed"
  | "recurring.pause"
  | "recurring.resume"
  | "notifications.saveFailed"
  | "notifications.pushTitle"
  | "notifications.loanRemindersTitle"
  | "notifications.loanRemindersDesc"
  | "loans.title"
  | "loans.description"
  | "loans.addLoan"
  | "loans.iLent"
  | "loans.iBorrowed"
  | "loans.counterparty"
  | "loans.someoneNotOnTally"
  | "loans.namePlaceholder"
  | "loans.principal"
  | "loans.schedule"
  | "loans.amount"
  | "loans.addInstallment"
  | "loans.empty"
  | "loans.youLent"
  | "loans.youBorrowed"
  | "loans.paidOff"
  | "loans.deleteLoan"
  | "loans.noSchedule"
  | "settings.recurring"
  | "settings.budgets"
  | "settings.savingsGoals"
  | "settings.autoImport"
  | "settings.dashboardWidgets"
  | "settings.calendar"
  | "settings.currency"
  | "settings.language"
  | "settings.usageGuide"
  | "settings.cardGuidelines"
  | "settings.passGuidelines"
  | "settings.faqs"
  | "settings.troubleshooting"
  | "settings.errorLog"
  | "settings.contact"
  | "settings.reportIssue"
  | "settings.changelog"
  | "common.cancel"
  | "common.dismiss"
  | "common.save"
  | "common.saving"
  | "common.delete"
  | "common.deleting"
  | "common.confirmDelete"
  | "common.edit"
  | "common.more"
  | "common.close"
  | "common.done"
  | "common.status"
  | "common.clear"
  | "common.apply"
  | "common.expense"
  | "common.income"
  | "common.transfer"
  | "common.date"
  | "common.wallet"
  | "common.notes"
  | "common.tags"
  | "common.category"
  | "form.location"
  | "form.locationPlaceholder"
  | "form.useCurrentLocation"
  | "form.locationPinned"
  | "form.locationRemovePin"
  | "form.locationDenied"
  | "form.locationUnavailable"
  | "detail.location"
  | "detail.pinnedLocation"
  | "detail.openInMaps"
  | "detail.type"
  | "detail.share"
  | "common.or"
  | "form.moneyOut"
  | "form.moneyIn"
  | "form.transferNote"
  | "form.amount"
  | "form.source"
  | "form.description"
  | "form.merchant"
  | "form.duplicateWarningTitle"
  | "form.addReceiptPhoto"
  | "form.duplicateWarningBody"
  | "form.saveDuplicateAnyway"
  | "form.merchantPlaceholderExpense"
  | "form.merchantPlaceholderIncome"
  | "form.merchantPlaceholderTransfer"
  | "form.splitIntoCategories"
  | "form.categoriesAndAmounts"
  | "form.addAnotherCategory"
  | "form.tagsAndNotes"
  | "form.notesPlaceholder"
  | "form.addTransaction"
  | "form.saveChanges"
  | "modal.editTransaction"
  | "modal.transactionDetails"
  | "modal.manual"
  | "modal.scan"
  | "modal.speak"
  | "modal.filters"
  | "modal.remainingBalance"
  | "modal.setRemainingTo"
  | "activities.yourBalance"
  | "activities.allWallets"
  | "activities.chooseWallet"
  | "activities.searchPlaceholder"
  | "activities.mergeMerchantsPrompt"
  | "activities.mergeMerchantsButton"
  | "activities.vendorFilterPrefix"
  | "activities.tag"
  | "activities.dateRange"
  | "activities.allCategories"
  | "activities.allTags"
  | "activities.clearAllFilters"
  | "activities.noTransactionsYet"
  | "activities.noTransactionsDesc"
  | "activities.noMatchingTransactions"
  | "activities.noMatchingDesc"
  | "activities.export"
  | "activities.select"
  | "activities.addTagPlaceholder"
  | "activities.addTag"
  | "activities.viewReceipt"
  | "activities.noTransactionSelected"
  | "activities.noTransactionSelectedDesc"
  | "activities.lastTransaction"
  | "activities.transaction"
  | "auth.welcomeBackTitle"
  | "auth.welcomeBackDesc"
  | "auth.signIn"
  | "auth.signingIn"
  | "auth.signUp"
  | "auth.username"
  | "auth.password"
  | "auth.confirmPassword"
  | "auth.enterUsername"
  | "auth.enterPassword"
  | "auth.forgotPassword"
  | "auth.continueWithGithub"
  | "auth.dontHaveAccount"
  | "auth.alreadyHaveAccount"
  | "auth.createAccount"
  | "auth.continueAsGuest"
  | "auth.startingGuest"
  | "guest.title"
  | "guest.desc"
  | "guest.limits"
  | "guest.keepData"
  | "guest.creating"
  | "guest.signOut"
  | "guest.signOutWarning"
  | "guest.signOutConfirm"
  | "auth.creatingAccount"
  | "auth.getStarted"
  | "auth.completeSteps"
  | "auth.stepCreateAccount"
  | "auth.stepSetupWallet"
  | "auth.stepLogExpense"
  | "auth.agreeToThe"
  | "auth.and"
  | "auth.termsAndConditions"
  | "auth.privacyPolicy"
  | "auth.welcomeTagline"
  | "auth.usernameHint"
  | "auth.passwordHint8"
  | "auth.reenterPassword"
  | "auth.somethingWentWrong"
  | "forgotPassword.title"
  | "forgotPassword.subtitle"
  | "forgotPassword.emailHint"
  | "forgotPassword.emailPlaceholder"
  | "forgotPassword.sendResetLink"
  | "forgotPassword.sending"
  | "forgotPassword.sentPrefix"
  | "forgotPassword.sentSuffix"
  | "forgotPassword.checkInbox"
  | "forgotPassword.backToSignIn"
  | "resetPassword.title"
  | "resetPassword.newPasswordLabel"
  | "resetPassword.confirmNewPasswordLabel"
  | "resetPassword.confirmPlaceholder"
  | "resetPassword.resetButton"
  | "resetPassword.tooShort"
  | "resetPassword.noMatch"
  | "resetPassword.missingToken"
  | "resetPassword.requestNewLink"
  | "offline.title"
  | "offline.desc"
  | "offline.tryAgain"
  | "welcome.greeting"
  | "welcome.welcomeBack"
  | "welcome.allAccountsBalance"
  | "common.add"
  | "common.loading"
  | "account.profile"
  | "account.email"
  | "account.notSet"
  | "account.enterCurrentPasswordConfirm"
  | "account.addEmailHint"
  | "account.saveUsername"
  | "account.saveEmail"
  | "account.usernameUpdated"
  | "account.emailUpdated"
  | "account.connectedAccounts"
  | "account.connected"
  | "account.notConnected"
  | "account.unlink"
  | "account.link"
  | "account.setPasswordFirstHint"
  | "account.setPasswordBeforeUnlink"
  | "account.githubLinked"
  | "account.noPasswordGithub"
  | "account.change"
  | "account.setPassword"
  | "account.setPasswordHint"
  | "account.currentPassword"
  | "account.newPassword"
  | "account.confirmNewPassword"
  | "account.savePassword"
  | "account.passwordUpdated"
  | "account.forgotItInstead"
  | "account.resetLinkSent"
  | "account.emailMeResetLink"
  | "account.sending"
  | "account.sessions"
  | "account.signOut"
  | "account.signOutAllDevices"
  | "account.recentSecurityActivity"
  | "account.noSecurityChanges"
  | "account.dangerZone"
  | "account.deleteAccountWarning"
  | "account.deleteAccount"
  | "account.unlinkGithubTitle"
  | "account.unlinkGithubDesc"
  | "account.signOutTitle"
  | "account.signOutDesc"
  | "account.signOutEverywhereTitle"
  | "account.signOutEverywhereDesc"
  | "account.signOutEverywhereButton"
  | "account.signingOut"
  | "account.unlinking"
  | "account.deleteAccountTitle"
  | "account.deleteAccountDesc"
  | "account.deleteAcknowledge"
  | "account.typeToConfirmPrefix"
  | "account.typeToConfirmSuffix"
  | "account.deleteMyAccount"
  | "account.security.usernameChanged"
  | "account.security.passwordChanged"
  | "account.security.passwordResetViaEmail"
  | "account.security.emailChanged"
  | "account.security.emailRemoved"
  | "account.security.signedOutEverywhere"
  | "account.security.tokenRevoked"
  | "account.security.signedIn"
  | "account.security.accountCreatedGithub"
  | "account.security.githubLinked"
  | "account.security.githubUnlinked"
  | "account.security.tokenCreated"
  | "permissions.deviceAccess"
  | "permissions.deviceAccessDesc"
  | "permissions.microphone"
  | "permissions.microphoneDesc"
  | "permissions.camera"
  | "permissions.cameraDesc"
  | "permissions.photos"
  | "permissions.photosDesc"
  | "permissions.granted"
  | "permissions.requestAccess"
  | "permissions.blockedRetry"
  | "permissions.notifications"
  | "currency.defaultCurrency"
  | "currency.defaultCurrencyDesc"
  | "currency.conversion"
  | "currency.conversionDescPrefix"
  | "currency.conversionDescSuffix"
  | "currency.autoConvert"
  | "currency.autoConvertDescPrefix"
  | "currency.autoConvertDescSuffix"
  | "currency.convertBalances"
  | "currency.convertBalancesDescPrefix"
  | "currency.convertBalancesDescSuffix"
  | "calendar.weekStartsOn"
  | "activities.settingsDesc"
  | "activities.hideMerchantIcons"
  | "activities.hideMerchantIconsDesc"
  | "activities.defaultTypeFilter"
  | "activities.defaultTypeFilterDesc"
  | "activities.typeAll"
  | "activities.defaultSort"
  | "activities.defaultSortDesc"
  | "activities.sortNewest"
  | "activities.sortOldest"
  | "activities.sortAmountDesc"
  | "activities.sortAmountAsc"
  | "activities.defaultDateRange"
  | "activities.defaultDateRangeDesc"
  | "activities.dateRangeNone"
  | "activities.dateRangeLast7"
  | "activities.dateRangeLast30"
  | "activities.dateRangeLast90"
  | "activities.dateRangeThisMonth"
  | "activities.groupByMonth"
  | "activities.groupByMonthDesc"
  | "activities.groupBy"
  | "activities.groupByDesc"
  | "activities.groupByOptionNone"
  | "activities.groupByOptionDay"
  | "activities.groupByOptionWeek"
  | "activities.groupByOptionMonth"
  | "analytics.title"
  | "analytics.customize"
  | "analytics.showSections"
  | "analytics.sectionOverview"
  | "analytics.sectionTrend"
  | "analytics.sectionCategories"
  | "analytics.sectionNetWorth"
  | "analytics.sectionBudgets"
  | "analytics.sectionForward"
  | "analytics.sectionSavings"
  | "analytics.savingsDesc"
  | "analytics.savingsOfIncome"
  | "analytics.pointsVsPrevious"
  | "analytics.noIncomeThisPeriod"
  | "analytics.sectionMovers"
  | "analytics.moversDesc"
  | "analytics.sectionWeekday"
  | "analytics.weekdayDesc"
  | "analytics.weekdayDescWithTop"
  | "analytics.sectionBiggest"
  | "analytics.biggestDesc"
  | "analytics.sectionMerchants"
  | "analytics.merchantsDesc"
  | "analytics.manageVendors"
  | "analytics.noMerchantsYet"
  | "analytics.merchantVisits"
  | "analytics.periodThisMonth"
  | "analytics.periodLastMonth"
  | "analytics.periodLast3Months"
  | "analytics.periodLast6Months"
  | "analytics.periodYearToDate"
  | "analytics.netWorth"
  | "analytics.net"
  | "analytics.vsLastPeriod"
  | "analytics.editNetWorth"
  | "analytics.trendDesc"
  | "analytics.netWorthWalletsDesc"
  | "analytics.walletsByBalance"
  | "analytics.budgetsGoalsDesc"
  | "analytics.manage"
  | "analytics.forwardDesc"
  | "analytics.manageRecurring"
  | "analytics.projectedSpend"
  | "analytics.spentSoFar"
  | "analytics.pace"
  | "analytics.upcomingRecurring"
  | "analytics.noRecurringScheduled"
  | "analytics.dueToday"
  | "analytics.dueTomorrow"
  | "analytics.dueInDays"
  | "activities.collapseSplitGroups"
  | "activities.collapseSplitGroupsDesc"
  | "activities.compactRows"
  | "activities.compactRowsDesc"
  | "activities.hideTagsInRow"
  | "activities.hideTagsInRowDesc"
  | "calendar.weekStartsOnDesc"
  | "calendar.monthStartsOn"
  | "calendar.monthStartsOnDesc"
  | "calendar.biweeklyAnchor"
  | "calendar.biweeklyAnchorDesc"
  | "calendar.defaultView"
  | "calendar.timezone"
  | "calendar.showWeekNumbers"
  | "calendar.showWeekNumbersDesc"
  | "calendar.alternateCalendar"
  | "calendar.alternateCalendarDesc"
  | "calendar.weekday.sunday"
  | "calendar.weekday.monday"
  | "calendar.weekday.tuesday"
  | "calendar.weekday.wednesday"
  | "calendar.weekday.thursday"
  | "calendar.weekday.friday"
  | "calendar.weekday.saturday"
  | "datePicker.selectDate"
  | "datePicker.today"
  | "calendar.prevMonth"
  | "calendar.nextMonth"
  | "calendar.weekAbbrev"
  | "dateRange.allDates"
  | "dateRange.from"
  | "dateRange.until"
  | "dateRange.startDate"
  | "dateRange.endDate"
  | "dateRange.filterByDateRange"
  | "calendar.view.today"
  | "calendar.view.thisWeek"
  | "calendar.view.thisMonth"
  | "calendar.view.allTime"
  | "calendar.tz.auto"
  | "calendar.altcal.none"
  | "calendar.altcal.lunar"
  | "calendar.altcal.buddhist"
  | "wallet.wallets"
  | "wallet.walletsDesc"
  | "wallet.addWallet"
  | "wallet.default"
  | "wallet.digital"
  | "wallet.cash"
  | "wallet.makeDefault"
  | "wallet.sharedWithYou"
  | "wallet.shareWallet"
  | "wallet.shareWalletDesc"
  | "wallet.pickFriendToInvite"
  | "wallet.invite"
  | "wallet.memberAccepted"
  | "wallet.memberDeclined"
  | "wallet.memberPending"
  | "wallet.removeMember"
  | "wallet.leaveShared"
  | "wallet.invitedBy"
  | "wallet.accept"
  | "wallet.defaultForActivities"
  | "wallet.defaultForActivitiesDesc"
  | "wallet.archived"
  | "wallet.archive"
  | "settings.keyboardShortcuts"
  | "settings.design"
  | "design.intro"
  | "design.modern"
  | "design.modernDesc"
  | "design.classic"
  | "design.classicDesc"
  | "keyboardShortcuts.title"
  | "keyboardShortcuts.groupGeneral"
  | "keyboardShortcuts.groupNavigation"
  | "keyboardShortcuts.commandPalette"
  | "keyboardShortcuts.addTransaction"
  | "keyboardShortcuts.showShortcuts"
  | "keyboardShortcuts.goActivities"
  | "keyboardShortcuts.goAnalytics"
  | "keyboardShortcuts.goWallet"
  | "keyboardShortcuts.goSettings"
  | "keyboardShortcuts.then"
  | "keyboardShortcuts.desktopOnly"
  | "commandPalette.placeholder"
  | "commandPalette.noResults"
  | "notification.title"
  | "notification.markAllRead"
  | "notification.empty"
  | "notification.emptyDesc"
  | "folder.newFolder"
  | "folder.editTitle"
  | "folder.nameLabel"
  | "folder.colorLabel"
  | "folder.couldNotSave"
  | "folder.couldNotDelete"
  | "folder.moveToNamed"
  | "folder.removeFromFolder"
  | "folder.passCountOne"
  | "folder.passCountOther"
  | "folder.rename"
  | "folder.delete"
  | "folder.deleteConfirm"
  | "wallet.addMoney"
  | "wallet.confirmArchiveTitle"
  | "wallet.confirmArchiveDesc"
  | "tag.couldNotLoad"
  | "tag.loading"
  | "tag.noTagsYet"
  | "tag.transaction"
  | "vendors.sortLabel"
  | "vendors.sortMostUsed"
  | "vendors.sortAlphabetical"
  | "vendors.sortRecent"
  | "vendors.sortHighestSpend"
  | "vendors.totalSpent"
  | "vendors.lastUsed"
  | "vendors.noVendorsYet"
  | "vendors.selectedCount"
  | "vendors.mergeInto"
  | "vendors.couldNotRename"
  | "vendors.couldNotMergeSome"
  | "tag.confirm"
  | "category.colorsIconsDesc"
  | "category.addCategory"
  | "category.noCategoriesPrefix"
  | "category.noCategoriesSuffix"
  | "recurring.title"
  | "recurring.addRule"
  | "recurring.desc"
  | "recurring.editingRulePrefix"
  | "recurring.editingRuleSuffix"
  | "recurring.frequency"
  | "recurring.startsOn"
  | "recurring.saveRule"
  | "recurring.noRulesYet"
  | "recurring.weekly"
  | "recurring.monthly"
  | "recurring.yearly"
  | "recurring.next"
  | "budget.title"
  | "budget.setABudget"
  | "budget.desc"
  | "budget.monthlyLimit"
  | "budget.rolloverToggle"
  | "budget.saveBudget"
  | "budget.noBudgetsYet"
  | "budget.rollover"
  | "budget.perMonth"
  | "savings.title"
  | "savings.desc"
  | "savings.name"
  | "savings.namePlaceholder"
  | "savings.targetAmount"
  | "savings.color"
  | "savings.saveGoal"
  | "savings.noGoalsYet"
  | "savings.withdraw"
  | "savings.noContributionsYet"
  | "friends.couldNotLoad"
  | "friends.searchPlaceholder"
  | "friends.searching"
  | "friends.noOneFound"
  | "friends.friendsStatus"
  | "friends.requestSent"
  | "friends.respondInRequests"
  | "friends.friendsTab"
  | "friends.familyTab"
  | "friends.requestsTab"
  | "friends.noFriendsYet"
  | "friends.addToFamily"
  | "friends.noFamilyYet"
  | "friends.noPendingRequests"
  | "friends.received"
  | "friends.sent"
  | "friends.accept"
  | "friends.decline"
  | "challenges.newChallenge"
  | "challenges.challengeName"
  | "challenges.targetDays"
  | "challenges.categoryOptional"
  | "challenges.invite"
  | "challenges.creating"
  | "challenges.createChallenge"
  | "challenges.noChallengesYet"
  | "challenges.people"
  | "challenges.combinedProgress"
  | "challenges.you"
  | "challenges.addContribution"
  | "challenges.removing"
  | "challenges.confirmDelete"
  | "challenges.confirmLeave"
  | "challenges.noPendingInvites"
  | "challenges.challengeInvites"
  | "challenges.wantsToSeeAmount"
  | "challenges.day"
  | "challenges.savingsRace"
  | "challenges.spendingLimit"
  | "challenges.noSpendDays"
  | "challenges.together"
  | "challenges.againstEachOther"
  | "split.equalSplit"
  | "split.customSplit"
  | "split.iPaidWhole"
  | "split.trackWhoPaid"
  | "split.settledUp"
  | "split.youreOwedPrefix"
  | "split.youOwePrefix"
  | "split.requireConfirmation"
  | "split.requireConfirmationDesc"
  | "split.splitsTab"
  | "split.newSplit"
  | "split.whatsTheBillFor"
  | "split.totalAmount"
  | "split.splitWith"
  | "split.whoOwesWhat"
  | "split.whoPaidWhat"
  | "split.allocated"
  | "split.you"
  | "split.createSplit"
  | "split.noSplitsYet"
  | "split.pending"
  | "split.declined"
  | "split.owesPrefix"
  | "split.paidPrefix"
  | "split.markSettled"
  | "split.copyShareLink"
  | "split.linkCopied"
  | "split.noPendingRequests"
  | "split.total"
  | "tokens.title"
  | "tokens.newToken"
  | "tokens.desc"
  | "tokens.copyNowWarning"
  | "tokens.copied"
  | "tokens.copy"
  | "tokens.nameLabel"
  | "tokens.namePlaceholder"
  | "tokens.createToken"
  | "tokens.noTokensYet"
  | "tokens.lastUsedPrefix"
  | "tokens.neverUsed"
  | "tokens.revoking"
  | "tokens.confirmRevoke"
  | "errors.clearAll"
  | "errors.descPart1"
  | "errors.descPart2"
  | "errors.descPart3"
  | "errors.noErrorsYet"
  | "errors.dismiss"
  | "errors.reportThisError"
  | "notifications.emailTitle"
  | "notifications.addEmailFirst"
  | "notifications.noBackgroundWorker"
  | "notifications.recurringLoggedTitle"
  | "notifications.recurringLoggedDesc"
  | "notifications.overBudgetTitle"
  | "notifications.overBudgetDesc"
  | "widget.summaryTitle"
  | "widget.summaryDesc"
  | "widget.categoryOverviewTitle"
  | "widget.categoryOverviewDesc"
  | "widget.walletsTitle"
  | "widget.walletsDesc"
  | "widget.recentTransactionsTitle"
  | "widget.recentTransactionsDesc"
  | "widget.incomeCardTitle"
  | "widget.incomeCardDesc"
  | "widget.expensesCardTitle"
  | "widget.expensesCardDesc"
  | "widget.remainingCardTitle"
  | "widget.remainingCardDesc"
  | "widget.todaySpendingTitle"
  | "widget.todaySpendingDesc"
  | "widget.yesterdaySpendingTitle"
  | "widget.yesterdaySpendingDesc"
  | "widget.weekSpendingTitle"
  | "widget.weekSpendingDesc"
  | "widget.monthSpendingTitle"
  | "widget.monthSpendingDesc"
  | "widget.yearSpendingTitle"
  | "widget.yearSpendingDesc"
  | "widget.todayIncomeTitle"
  | "widget.todayIncomeDesc"
  | "widget.monthIncomeTitle"
  | "widget.monthIncomeDesc"
  | "widget.yearIncomeTitle"
  | "widget.yearIncomeDesc"
  | "widget.netWorthTitle"
  | "widget.netWorthDesc"
  | "widget.totalBalanceTitle"
  | "widget.totalBalanceDesc"
  | "widget.avgDailySpendingTitle"
  | "widget.avgDailySpendingDesc"
  | "widget.avgTransactionAmountTitle"
  | "widget.avgTransactionAmountDesc"
  | "widget.avgIncomeAmountTitle"
  | "widget.avgIncomeAmountDesc"
  | "widget.biggestExpenseTitle"
  | "widget.biggestExpenseDesc"
  | "widget.biggestIncomeTitle"
  | "widget.biggestIncomeDesc"
  | "widget.transactionCountTitle"
  | "widget.transactionCountDesc"
  | "widget.transfersTotalTitle"
  | "widget.transfersTotalDesc"
  | "widget.walletCountTitle"
  | "widget.walletCountDesc"
  | "widget.categoryCountTitle"
  | "widget.categoryCountDesc"
  | "widget.tagCountTitle"
  | "widget.tagCountDesc"
  | "widget.monthComparisonTitle"
  | "widget.monthComparisonDesc"
  | "widget.incomeComparisonTitle"
  | "widget.incomeComparisonDesc"
  | "widget.weekComparisonTitle"
  | "widget.weekComparisonDesc"
  | "widget.yearOverYearTitle"
  | "widget.yearOverYearDesc"
  | "widget.savingsRateTitle"
  | "widget.savingsRateDesc"
  | "widget.monthProgressTitle"
  | "widget.monthProgressDesc"
  | "widget.yearProgressTitle"
  | "widget.yearProgressDesc"
  | "widget.spendPaceTitle"
  | "widget.spendPaceDesc"
  | "widget.walletUsageTitle"
  | "widget.walletUsageDesc"
  | "widget.last14DaysSparkTitle"
  | "widget.last14DaysSparkDesc"
  | "widget.last14DaysIncomeSparkTitle"
  | "widget.last14DaysIncomeSparkDesc"
  | "widget.last6MonthsSparkTitle"
  | "widget.last6MonthsSparkDesc"
  | "widget.categoryDonutTitle"
  | "widget.categoryDonutDesc"
  | "widget.typeDonutTitle"
  | "widget.typeDonutDesc"
  | "widget.walletDonutTitle"
  | "widget.walletDonutDesc"
  | "widget.last30DaysHeatmapTitle"
  | "widget.last30DaysHeatmapDesc"
  | "widget.last90DaysHeatmapTitle"
  | "widget.last90DaysHeatmapDesc"
  | "widget.walletShareBarTitle"
  | "widget.walletShareBarDesc"
  | "widget.categoryShareBarTitle"
  | "widget.categoryShareBarDesc"
  | "widget.incomeVsExpenseBarsTitle"
  | "widget.incomeVsExpenseBarsDesc"
  | "widget.cashVsDigitalBarsTitle"
  | "widget.cashVsDigitalBarsDesc"
  | "widget.topCategoriesTitle"
  | "widget.topCategoriesDesc"
  | "widget.topMerchantsTitle"
  | "widget.topMerchantsDesc"
  | "widget.topTagsTitle"
  | "widget.topTagsDesc"
  | "widget.topIncomeSourcesTitle"
  | "widget.topIncomeSourcesDesc"
  | "widget.walletDistributionTitle"
  | "widget.walletDistributionDesc"
  | "widget.expensesByWalletTitle"
  | "widget.expensesByWalletDesc"
  | "widget.topMerchantsLeaderboardTitle"
  | "widget.topMerchantsLeaderboardDesc"
  | "widget.topCategoriesLeaderboardTitle"
  | "widget.topCategoriesLeaderboardDesc"
  | "widget.last7DaysTitle"
  | "widget.last7DaysDesc"
  | "widget.netWorthTickerTitle"
  | "widget.netWorthTickerDesc"
  | "widget.walletTickerTitle"
  | "widget.walletTickerDesc"
  | "widget.todayPillTitle"
  | "widget.todayPillDesc"
  | "widget.pacePillTitle"
  | "widget.pacePillDesc"
  | "widget.noSpendDaysTitle"
  | "widget.noSpendDaysDesc"
  | "widget.balanceHeroTitle"
  | "widget.balanceHeroDesc"
  | "widget.payPeriodStepperTitle"
  | "widget.payPeriodStepperDesc"
  | "widget.spendingStreakTitle"
  | "widget.spendingStreakDesc"
  | "widget.budgetOverviewTitle"
  | "widget.budgetOverviewDesc"
  | "widget.savingsGoalsWidgetTitle"
  | "widget.savingsGoalsWidgetDesc"
  | "widget.welcomeTitle"
  | "widget.welcomeDesc"
  | "dashboardWidgetContent.there"
  | "dashboardWidgetContent.allAccountsTotalBalance"
  | "dashboardWidgetContent.allWalletsCombined"
  | "dashboardWidgetContent.across"
  | "dashboardWidgetContent.activeWallet"
  | "dashboardWidgetContent.activeWallets"
  | "dashboardWidgetContent.activeWalletsLabel"
  | "dashboardWidgetContent.thisMonth"
  | "dashboardWidgetContent.noExpensesThisMonth"
  | "dashboardWidgetContent.noIncomeThisMonth"
  | "dashboardWidgetContent.vs"
  | "dashboardWidgetContent.lastMonth"
  | "dashboardWidgetContent.lastWeek"
  | "dashboardWidgetContent.lastYear"
  | "dashboardWidgetContent.day"
  | "dashboardWidgetContent.of"
  | "dashboardWidgetContent.aheadOfPace"
  | "dashboardWidgetContent.behindPace"
  | "dashboardWidgetContent.onPace"
  | "dashboardWidgetContent.noWalletsYet"
  | "dashboardWidgetContent.share"
  | "dashboardWidgetContent.expenseType"
  | "dashboardWidgetContent.incomeType"
  | "dashboardWidgetContent.transferType"
  | "dashboardWidgetContent.walletShareTitle"
  | "dashboardWidgetContent.categoryShareTitle"
  | "dashboardWidgetContent.cash"
  | "dashboardWidgetContent.digital"
  | "dashboardWidgetContent.unassigned"
  | "dashboardWidgetContent.aheadLastMonth"
  | "dashboardWidgetContent.behindLastMonth"
  | "dashboardWidgetContent.noSpendDaysThisWeek"
  | "dashboardWidgetContent.stageStart"
  | "dashboardWidgetContent.stageMidMonth"
  | "dashboardWidgetContent.stageEnd"
  | "dashboardWidgetContent.underAverageSpendingThisWeek"
  | "summaryCard.income"
  | "summaryCard.expenses"
  | "summaryCard.remaining"
  | "widgetCategory.overview"
  | "widgetCategory.chart"
  | "widgetCategory.budget"
  | "widgetCategory.goals"
  | "widgetWidth.small"
  | "widgetWidth.medium"
  | "widgetWidth.large"
  | "dashboardWidgets.addWidgetAria"
  | "dashboardWidgets.doneAria"
  | "dashboardWidgets.intro"
  | "dashboardWidgets.emptyState"
  | "dashboardWidgets.show"
  | "dashboardWidgets.color"
  | "dashboardWidgets.wallet"
  | "dashboardWidgets.allWallets"
  | "dashboardWidgets.quickActionButton"
  | "dashboardWidgets.addAWidgetTitle"
  | "dashboardWidgets.categoriesBack"
  | "dashboardWidgets.widgetSingular"
  | "dashboardWidgets.widgetPlural"
  | "dashboardWidgets.reorderPrefix"
  | "dashboardWidgets.removePrefix"
  | "dashboardWidgets.configurePrefix"
  | "dashboardWidgets.sizePrefix"
  | "wallet.editTitle"
  | "wallet.appDefault"
  | "wallet.nameLabel"
  | "wallet.namePlaceholder"
  | "wallet.typeLabel"
  | "wallet.colorLabel"
  | "wallet.currencyLabel"
  | "wallet.currencyNote"
  | "wallet.balanceLabel"
  | "wallet.balanceNote"
  | "wallet.latestTransactions"
  | "wallet.noTransactionsYet"
  | "wallet.defaultWalletLabel"
  | "wallet.defaultWalletDesc"
  | "wallet.showBalanceOnCardLabel"
  | "wallet.showBalanceOnCardDesc"
  | "wallet.showCurrencyOnCardLabel"
  | "wallet.showCurrencyOnCardDesc"
  | "wallet.showCardNumberLabel"
  | "wallet.showCardNumberDesc"
  | "wallet.showNameOnCardLabel"
  | "wallet.showNameOnCardDesc"
  | "wallet.uploadTemplateLabel"
  | "wallet.uploadTemplateDesc"
  | "wallet.uploadTemplateVariationDesc"
  | "wallet.viewCardGuidelinesLink"
  | "cardGuidelines.title"
  | "cardGuidelines.intro"
  | "cardGuidelines.ratioLabel"
  | "cardGuidelines.physicalSizeLabel"
  | "cardGuidelines.minHeightLabel"
  | "cardGuidelines.ratioHeading"
  | "cardGuidelines.ratioBody"
  | "cardGuidelines.layoutHeading"
  | "cardGuidelines.layoutBody"
  | "cardGuidelines.colorHeading"
  | "cardGuidelines.colorBody"
  | "cardGuidelines.checklistHeading"
  | "cardGuidelines.checklistBody"
  | "wallet.templateNameLabel"
  | "wallet.templateSubmittedDesc"
  | "wallet.premadeCardsLabel"
  | "wallet.templateReviewTitle"
  | "wallet.noTemplatesToReview"
  | "wallet.unknownSubmitter"
  | "wallet.approveTemplate"
  | "wallet.rejectTemplate"
  | "wallet.forceTogglesLabel"
  | "wallet.forceTogglesDesc"
  | "wallet.forceOn"
  | "wallet.forceOff"
  | "wallet.confirmDeleteTemplateDesc"
  | "wallet.forceLabelName"
  | "wallet.forceLabelNetworkBadge"
  | "wallet.forceLabelChip"
  | "wallet.forceLabelNfc"
  | "wallet.forceLabelCardNumber"
  | "wallet.forceLabelBalance"
  | "wallet.forceLabelCurrency"
  | "wallet.forceLabelHolderName"
  | "wallet.forceLabelExpiry"
  | "wallet.forceAuto"
  | "wallet.showHolderNameLabel"
  | "wallet.showHolderNameDesc"
  | "wallet.showExpiryLabel"
  | "wallet.showExpiryDesc"
  | "wallet.lockCurrencyLabel"
  | "wallet.lockCurrencyDesc"
  | "wallet.lockCurrencyOffDesc"
  | "wallet.templateCountryLabel"
  | "wallet.templateCountryPlaceholder"
  | "wallet.templateOtherCountryLabel"
  | "wallet.namePositionLabel"
  | "wallet.lockTextColorLabel"
  | "wallet.lockTextColorDesc"
  | "wallet.lockSvgColorsLabel"
  | "wallet.lockSvgColorsDesc"
  | "wallet.forceNamePositionLabel"
  | "wallet.forceNamePositionDesc"
  | "wallet.forceNfcPositionLabel"
  | "wallet.forceChipPositionLabel"
  | "wallet.forceCardNumberPositionLabel"
  | "wallet.forceNfcPositionDesc"
  | "wallet.forceChipPositionDesc"
  | "wallet.forceCardNumberPositionDesc"
  | "wallet.nfcSizeLabel"
  | "wallet.nfcSizeSmall"
  | "wallet.nfcSizeBig"
  | "wallet.forceNfcSizeLabel"
  | "wallet.forceNfcSizeDesc"
  | "wallet.templateCategoryLabel"
  | "wallet.templateCategoryAll"
  | "wallet.templateCategoryEMoney"
  | "wallet.templateCategoryCreditCard"
  | "wallet.templateCategoryDebitCard"
  | "wallet.templateCategoryTransitCard"
  | "wallet.templateCategoryIdCard"
  | "wallet.templateCategoryMembership"
  | "wallet.templateCategoryOther"
  | "wallet.forceNetworkLabel"
  | "wallet.forceNetworkDesc"
  | "wallet.tabBasics"
  | "wallet.tabCardDetails"
  | "wallet.tabLook"
  | "wallet.tabTemplate"
  | "wallet.chipSectionLabel"
  | "wallet.cardFaceSectionLabel"
  | "wallet.onCardDisplayLabel"
  | "wallet.templateDetailsLabel"
  | "wallet.templateLocksLabel"
  | "wallet.cardNumberLast4OnlyLabel"
  | "wallet.cardNumberLast4OnlyDesc"
  | "wallet.cardNumberPositionLabel"
  | "wallet.showNetworkBadgeLabel"
  | "wallet.showNetworkBadgeDesc"
  | "wallet.badgePositionLabel"
  | "wallet.badgePositionTopLeft"
  | "wallet.badgePositionTopRight"
  | "wallet.badgePositionBottomLeft"
  | "wallet.badgePositionBottomRight"
  | "wallet.showChipLabel"
  | "wallet.showChipDesc"
  | "wallet.showNfcLabel"
  | "wallet.showNfcDesc"
  | "wallet.nfcPositionLabel"
  | "wallet.chipColorLabel"
  | "wallet.chipColorGold"
  | "wallet.chipColorSilver"
  | "wallet.chipColorRoseGold"
  | "wallet.chipColorGraphite"
  | "wallet.chipColorCopper"
  | "wallet.chipPositionLabel"
  | "wallet.chipPositionTop"
  | "wallet.chipPositionMiddle"
  | "wallet.chipPositionBottom"
  | "wallet.chipPositionTopLeft"
  | "wallet.chipPositionTopCenter"
  | "wallet.chipPositionTopRight"
  | "wallet.chipPositionMiddleLeft"
  | "wallet.chipPositionMiddleCenter"
  | "wallet.chipPositionMiddleRight"
  | "wallet.chipPositionBottomLeft"
  | "wallet.chipPositionBottomCenter"
  | "wallet.chipPositionBottomRight"
  | "walletTransfer.title"
  | "walletTransfer.from"
  | "walletTransfer.to"
  | "walletTransfer.amountLabel"
  | "walletTransfer.notesLabel"
  | "walletTransfer.notesPlaceholder"
  | "walletTransfer.toAmountLabel"
  | "walletTransfer.toAmountHint"
  | "walletTransfer.converting"
  | "walletTransfer.movesPrefix"
  | "walletTransfer.movesSuffix"
  | "walletTransfer.transferring"
  | "category.editTitle"
  | "category.nameLabel"
  | "category.nameLockedNote"
  | "category.colorLabel"
  | "category.iconLabel"
  | "category.none"
  | "category.icon.cart"
  | "category.icon.burger"
  | "category.icon.coffee"
  | "category.icon.car"
  | "category.icon.bus"
  | "category.icon.plane"
  | "category.icon.home"
  | "category.icon.bulb"
  | "category.icon.shield"
  | "category.icon.movie"
  | "category.icon.game"
  | "category.icon.book"
  | "category.icon.health"
  | "category.icon.pill"
  | "category.icon.beauty"
  | "category.icon.baby"
  | "category.icon.pet"
  | "category.icon.gift"
  | "category.icon.gradcap"
  | "category.icon.fitness"
  | "category.icon.art"
  | "category.icon.music"
  | "category.icon.phone"
  | "category.icon.receipt"
  | "category.icon.tool"
  | "category.icon.box"
  | "category.icon.shirt"
  | "category.icon.card"
  | "category.icon.cash"
  | "category.icon.bank"
  | "category.icon.chart"
  | "category.icon.wine"
  | "faq.subtitle"
  | "faq.searchPlaceholder"
  | "faq.noMatchPrefix"
  | "faq.q1"
  | "faq.a1Before"
  | "faq.a1After"
  | "faq.q2"
  | "faq.a2"
  | "faq.q3"
  | "faq.a3"
  | "faq.q4"
  | "faq.a4"
  | "faq.q5"
  | "faq.a5"
  | "faq.q6"
  | "faq.a6"
  | "faq.q7"
  | "faq.a7"
  | "faq.q8"
  | "faq.a8"
  | "faq.q9"
  | "faq.a9Before"
  | "contact.emailHeading"
  | "contact.emailBefore"
  | "contact.developerHeading"
  | "contact.developerBefore"
  | "contact.securityHeading"
  | "contact.securityBefore"
  | "contact.securityMiddle"
  | "contact.securityAfter"
  | "contact.securityPolicyLinkText"
  | "contact.bugsHeading"
  | "contact.bugsBefore"
  | "terms.title"
  | "terms.licenseHeading"
  | "terms.licenseBefore"
  | "terms.licenseAfter"
  | "terms.asIsHeading"
  | "terms.asIsBody"
  | "terms.selfHostHeading"
  | "terms.selfHostBody"
  | "privacy.title"
  | "privacy.storedHeading"
  | "privacy.storedBody"
  | "privacy.isolationHeading"
  | "privacy.isolationBody"
  | "privacy.thirdPartiesHeading"
  | "privacy.thirdPartiesBefore"
  | "privacy.thirdPartiesMiddle1"
  | "privacy.thirdPartiesMiddle2"
  | "privacy.thirdPartiesAfter"
  | "privacy.locationHeading"
  | "privacy.locationBody"
  | "privacy.selfHostedHeading"
  | "privacy.selfHostedBody"
  | "troubleshooting.title"
  | "troubleshooting.introBefore"
  | "troubleshooting.introAfter"
  | "troubleshooting.g1Heading"
  | "troubleshooting.g2Heading"
  | "troubleshooting.g3Heading"
  | "troubleshooting.g4Heading"
  | "troubleshooting.g5Heading"
  | "troubleshooting.g1e1Error"
  | "troubleshooting.g1e1What"
  | "troubleshooting.g1e1Why"
  | "troubleshooting.g1e1Fix"
  | "troubleshooting.g1e2Error"
  | "troubleshooting.g1e2What"
  | "troubleshooting.g1e2Why"
  | "troubleshooting.g1e2Fix"
  | "troubleshooting.g1e3Error"
  | "troubleshooting.g1e3What"
  | "troubleshooting.g1e3Why"
  | "troubleshooting.g1e3Fix"
  | "troubleshooting.g1e4Error"
  | "troubleshooting.g1e4What"
  | "troubleshooting.g1e4Why"
  | "troubleshooting.g1e4Fix"
  | "troubleshooting.g1e5Error"
  | "troubleshooting.g1e5What"
  | "troubleshooting.g1e5Why"
  | "troubleshooting.g1e5Fix"
  | "troubleshooting.g1e6Error"
  | "troubleshooting.g1e6What"
  | "troubleshooting.g1e6Why"
  | "troubleshooting.g1e6Fix"
  | "troubleshooting.g2e1Error"
  | "troubleshooting.g2e1What"
  | "troubleshooting.g2e1Why"
  | "troubleshooting.g2e1Fix"
  | "troubleshooting.g2e2Error"
  | "troubleshooting.g2e2What"
  | "troubleshooting.g2e2Why"
  | "troubleshooting.g2e2Fix"
  | "troubleshooting.g2e3Error"
  | "troubleshooting.g2e3What"
  | "troubleshooting.g2e3Why"
  | "troubleshooting.g2e3Fix"
  | "troubleshooting.g2e4Error"
  | "troubleshooting.g2e4What"
  | "troubleshooting.g2e4Why"
  | "troubleshooting.g2e4Fix"
  | "troubleshooting.g2e5Error"
  | "troubleshooting.g2e5What"
  | "troubleshooting.g2e5Why"
  | "troubleshooting.g2e5Fix"
  | "troubleshooting.g2e6Error"
  | "troubleshooting.g2e6What"
  | "troubleshooting.g2e6Why"
  | "troubleshooting.g2e6Fix"
  | "troubleshooting.g3e1Error"
  | "troubleshooting.g3e1What"
  | "troubleshooting.g3e1Why"
  | "troubleshooting.g3e1Fix"
  | "troubleshooting.g3e2Error"
  | "troubleshooting.g3e2What"
  | "troubleshooting.g3e2Why"
  | "troubleshooting.g3e2Fix"
  | "troubleshooting.g4e1Error"
  | "troubleshooting.g4e1What"
  | "troubleshooting.g4e1Why"
  | "troubleshooting.g4e1Fix"
  | "troubleshooting.g4e2Error"
  | "troubleshooting.g4e2What"
  | "troubleshooting.g4e2Why"
  | "troubleshooting.g4e2Fix"
  | "troubleshooting.g4e3Error"
  | "troubleshooting.g4e3What"
  | "troubleshooting.g4e3Why"
  | "troubleshooting.g4e3Fix"
  | "troubleshooting.g4e4Error"
  | "troubleshooting.g4e4What"
  | "troubleshooting.g4e4Why"
  | "troubleshooting.g4e4Fix"
  | "troubleshooting.g5e1Error"
  | "troubleshooting.g5e1What"
  | "troubleshooting.g5e1Why"
  | "troubleshooting.g5e1Fix"
  | "troubleshooting.g5e2Error"
  | "troubleshooting.g5e2What"
  | "troubleshooting.g5e2Why"
  | "troubleshooting.g5e2Fix"
  | "troubleshooting.g5e3Error"
  | "troubleshooting.g5e3What"
  | "troubleshooting.g5e3Why"
  | "troubleshooting.g5e3Fix"
  | "troubleshooting.g5e4Error"
  | "troubleshooting.g5e4What"
  | "troubleshooting.g5e4Why"
  | "troubleshooting.g5e4Fix"
  | "troubleshooting.whatHappenedLabel"
  | "troubleshooting.whyLabel"
  | "troubleshooting.fixLabel"
  | "usageGuide.title"
  | "usageGuide.subtitle"
  | "usageGuide.s1Title"
  | "usageGuide.s1Part1"
  | "usageGuide.s1Part2"
  | "usageGuide.s1Part3"
  | "usageGuide.s2Title"
  | "usageGuide.s2Part1"
  | "usageGuide.s2Part2"
  | "usageGuide.s2Li1Label"
  | "usageGuide.s2Li1Body"
  | "usageGuide.s2Li2Label"
  | "usageGuide.s2Li2Body"
  | "usageGuide.s2Li3Label"
  | "usageGuide.s2Li3Body"
  | "usageGuide.s3Title"
  | "usageGuide.s3Part1"
  | "usageGuide.s3Part2"
  | "usageGuide.s3Part3"
  | "usageGuide.s4Title"
  | "usageGuide.s4Part1"
  | "usageGuide.s4Span"
  | "usageGuide.s4Part2"
  | "usageGuide.s4Part3"
  | "usageGuide.sPassesTitle"
  | "usageGuide.sPassesPart1"
  | "usageGuide.sPassesSpan"
  | "usageGuide.sPassesPart2"
  | "usageGuide.s5Title"
  | "usageGuide.s5Part1"
  | "usageGuide.s5Part2"
  | "usageGuide.s6Title"
  | "usageGuide.s6Part1"
  | "usageGuide.s6Part2"
  | "usageGuide.s7Title"
  | "usageGuide.s7Body"
  | "usageGuide.s8Title"
  | "usageGuide.s8Part1"
  | "usageGuide.s8Span"
  | "usageGuide.s8Part2"
  | "usageGuide.s9Title"
  | "usageGuide.s9Body"
  | "usageGuide.s10Title"
  | "usageGuide.s10Body";

// Languages that read right-to-left — used to set <html dir> so at least
// text direction is correct even before full RTL layout mirroring exists.
export const RTL_LANGUAGES = new Set(["ar", "ur"]);

// English ships in the main bundle (it is the fallback for every key); every
// other language lives in lib/i18n/lang/<code>.ts and is loaded on demand —
// see lib/i18n/loaders.ts and lib/language-context.tsx.
export const EN_MESSAGES: Record<MessageKey, string> = {
  "nav.dashboard": "Dashboard",
  "nav.analytics": "Analytics",
  "faq.subtitle": "Tap a question to expand it, or search to jump straight to one.",
  "faq.searchPlaceholder": "Search FAQs...",
  "faq.noMatchPrefix": "No FAQs match",
  "faq.q1": "Do I need to deploy anything to use Tally?",
  "faq.a1Before": "No — go to",
  "faq.a1After": "and create your own account. It's free and your data is private to your account.",
  "faq.q2": "Can other people on the same deployment see my data?",
  "faq.a2": "No. Every account's expenses, categories, and balance are fully isolated from every other account — no one else can see or modify them.",
  "faq.q3": "Do I need a Gemini API key to use receipt scanning or voice entry?",
  "faq.a3": "Only if you're self-hosting your own instance. On the shared live deployment, scanning and voice entry work out of the box. Manual entry and CSV export never require a key.",
  "faq.q4": "What happens to my receipt photos and voice recordings?",
  "faq.a4": "Receipt images and voice recordings are sent to Google Gemini to extract the transaction details, then the receipt image is stored with your transaction so you can view it later. See the Privacy Policy for the full breakdown.",
  "faq.q5": "Can I change my default currency, or track amounts in more than one currency?",
  "faq.a5": "You can set a default currency in Settings, and optionally enable automatic conversion so scanned or spoken amounts in a different currency get converted to your default before you review them.",
  "faq.q6": "Can I delete my account, or reset my password if I forget it?",
  "faq.a6": "Yes to both. Account deletion is in Settings > Account. If you forget your password, set an email on your account first (Settings > Account), then use \"Forgot password?\" on the login screen to get a reset link.",
  "faq.q7": "What else can I track besides individual transactions?",
  "faq.a7": "Multiple wallets (cash, bank, e-wallet) with transfers between them, recurring transactions on a schedule, per-category monthly budgets with rollover, and savings goals — all under Settings > Budgeting/Wallets.",
  "faq.q8": "Can Tally add receipts automatically without me opening the app?",
  "faq.a8": "Yes — create a personal access token in Settings > Automatic import, then set up an iOS Shortcut or the Android share sheet to send photos straight to Tally. Auto-imported transactions are tagged auto-import and keep the source photo attached, so you can double-check anything the automation misread.",
  "faq.q9": "Is Tally free and open source?",
  "faq.a9Before": "Yes, released under the MIT License. The full source is on",
  "contact.emailHeading": "Email",
  "contact.emailBefore": "For general questions, feedback, or account issues, email",
  "contact.developerHeading": "Developer",
  "contact.developerBefore": "Tally is developed by",
  "contact.securityHeading": "Security vulnerabilities",
  "contact.securityBefore": "Please don't open a public GitHub issue for security reports — email",
  "contact.securityMiddle": "directly instead. See the",
  "contact.securityAfter": "for details.",
  "contact.securityPolicyLinkText": "Security Policy",
  "contact.bugsHeading": "Bugs & feature requests",
  "contact.bugsBefore": "See",
  "terms.title": "Terms of Service",
  "terms.licenseHeading": "Open source, MIT licensed",
  "terms.licenseBefore": "Tally is free, open-source software released under the MIT License. You're free to use, copy, modify, and deploy it, subject to the terms of that license. See the",
  "terms.licenseAfter": "file for the full text.",
  "terms.asIsHeading": "Provided as-is",
  "terms.asIsBody": "Tally is provided \"as is\", without warranty of any kind. The software is offered for personal expense tracking; you're responsible for keeping your own backups and for the accuracy of the data you enter.",
  "terms.selfHostHeading": "Self-hosted responsibility",
  "terms.selfHostBody": "Whoever deploys a given Tally instance is responsible for that deployment — its security, its database, who they give access to, and how they handle the data stored there.",
  "privacy.title": "Privacy Policy",
  "privacy.storedHeading": "What's stored",
  "privacy.storedBody": "Tally stores the expenses and income you log (date, amount, merchant, category, notes, tags), any receipt images you attach, your wallets, recurring rules, budgets, and savings goals, your category customizations, your currency and display preferences, and your account credentials (your password is stored as a salted hash, never in plain text). If you add an email for password reset or notifications, it's stored alongside your account. If you create a personal access token for automatic receipt import, only its hash is stored — the raw token is shown to you once and can't be recovered.",
  "privacy.isolationHeading": "Your data is private to your account",
  "privacy.isolationBody": "Tally supports multiple accounts on a single deployment. Every account's expenses, categories, and settings are isolated — no other account on the same deployment can see or modify your data.",
  "privacy.thirdPartiesHeading": "Third parties",
  "privacy.thirdPartiesBefore": "When you scan a receipt or record a voice memo, the image or audio is sent to",
  "privacy.thirdPartiesMiddle1": "to extract the transaction details. If automatic currency conversion is enabled, detected amounts are converted using exchange rates from",
  "privacy.thirdPartiesMiddle2": ", a free ECB-rate API. If you set an email on your account, password reset links and any opted-in recurring/budget notification emails are sent via",
  "privacy.thirdPartiesAfter": ". No other third parties receive your data.",
  "privacy.locationHeading": "Location",
  "privacy.locationBody": "A transaction can optionally store where it happened — a place you type, a store address read from a scanned receipt, or your coordinates if you tap \"Use current location\". Your device's location is only read when you tap that button, never in the background. When a transaction with coordinates is opened, its map preview is loaded from OpenStreetMap, which receives that position to draw the map; \"Open in Maps\" hands the place to Google Maps only when you tap it.",
  "privacy.selfHostedHeading": "Self-hosted",
  "privacy.selfHostedBody": "Tally is open-source, self-hosted software. Whoever deploys a given instance controls the actual database and infrastructure it runs on — this policy describes how the application itself handles data, not any particular deployment's operational practices.",
  "troubleshooting.title": "Troubleshooting",
  "troubleshooting.introBefore": "Common error messages Tally can show, what they mean, and how to fix or work around them. See also",
  "troubleshooting.introAfter": "for a record of what you've actually run into.",
  "troubleshooting.g1Heading": "Voice entry & microphone",
  "troubleshooting.g2Heading": "Receipt scanning & photos",
  "troubleshooting.g3Heading": "Gemini availability & limits",
  "troubleshooting.g4Heading": "Network & connectivity",
  "troubleshooting.g5Heading": "Account & sign-in",
  "troubleshooting.g1e1Error": "Microphone access is blocked.",
  "troubleshooting.g1e1What": "Tapping the mic button didn't start recording.",
  "troubleshooting.g1e1Why": "Your browser or device has microphone permission denied for Tally.",
  "troubleshooting.g1e1Fix": "Enable microphone access for this site in your browser or device settings, then try again. In Settings > Permissions you can also request it directly.",
  "troubleshooting.g1e2Error": "No microphone was found on this device.",
  "troubleshooting.g1e2What": "The mic button failed immediately.",
  "troubleshooting.g1e2Why": "The browser couldn't detect any microphone hardware.",
  "troubleshooting.g1e2Fix": "Check that a microphone is connected (or built-in mic isn't disabled), then retry. Use manual entry as a fallback.",
  "troubleshooting.g1e3Error": "Your microphone is already in use by another app.",
  "troubleshooting.g1e3What": "Recording wouldn't start.",
  "troubleshooting.g1e3Why": "Another app or browser tab has an active claim on the microphone.",
  "troubleshooting.g1e3Fix": "Close the other app/tab using the mic (video calls are a common culprit), then try again.",
  "troubleshooting.g1e4Error": "Microphone access requires a secure (HTTPS) connection.",
  "troubleshooting.g1e4What": "Recording is unavailable.",
  "troubleshooting.g1e4Why": "Browsers only allow microphone access on HTTPS (or localhost) — this page loaded over plain HTTP.",
  "troubleshooting.g1e4Fix": "Only relevant to self-hosted deployments running without HTTPS. Deploy behind HTTPS; see the README's security notes.",
  "troubleshooting.g1e5Error": "Gemini couldn't process that recording.",
  "troubleshooting.g1e5What": "The recording uploaded, but the transcription/extraction step failed.",
  "troubleshooting.g1e5Why": "Gemini rejected the audio — often too short, silent, or an unusual format.",
  "troubleshooting.g1e5Fix": "Try recording again with a clearer, longer description, or switch to manual entry.",
  "troubleshooting.g1e6Error": "The model returned an empty response.",
  "troubleshooting.g1e6What": "Same as above — no transaction came back from the recording.",
  "troubleshooting.g1e6Why": "Gemini had nothing usable to extract from what it heard.",
  "troubleshooting.g1e6Fix": "Re-record and speak clearly, including an amount and merchant/source.",
  "troubleshooting.g2e1Error": "Gemini couldn't process that image.",
  "troubleshooting.g2e1What": "A scanned photo failed to extract.",
  "troubleshooting.g2e1Why": "The image may be blurry, cropped oddly, or in a format Gemini's API doesn't accept in this environment.",
  "troubleshooting.g2e1Fix": "Try a clearer, well-lit photo, or a different format (Tally auto-converts HEIC photos before upload, but a re-take often helps too). Manual entry always works.",
  "troubleshooting.g2e2Error": "Unsupported image type.",
  "troubleshooting.g2e2What": "A file was rejected before it was even sent to Gemini.",
  "troubleshooting.g2e2Why": "Only JPEG, PNG, WEBP, and HEIC/HEIF are accepted.",
  "troubleshooting.g2e2Fix": "Export or re-save the photo as JPEG/PNG and try again.",
  "troubleshooting.g2e3Error": "Image is too large (max 8MB).",
  "troubleshooting.g2e3What": "The upload was rejected for size.",
  "troubleshooting.g2e3Why": "Full-resolution camera photos can exceed 8MB.",
  "troubleshooting.g2e3Fix": "Tally automatically downsizes photos before upload in most cases; if this still happens, try a lower camera resolution or crop the image first.",
  "troubleshooting.g2e4Error": "None of those files could be used.",
  "troubleshooting.g2e4What": "Bulk photo selection resulted in nothing to scan.",
  "troubleshooting.g2e4Why": "Every selected file failed the type or size check (the message says which).",
  "troubleshooting.g2e4Fix": "Re-select using JPEG/PNG/WEBP/HEIC files under 8MB each.",
  "troubleshooting.g2e5Error": "Receipt scanning isn't available right now.",
  "troubleshooting.g2e5What": "Scanning fails immediately, every time.",
  "troubleshooting.g2e5Why": "A deployment configuration problem (missing/invalid Gemini API key) — not something fixable from the app itself.",
  "troubleshooting.g2e5Fix": "Use manual entry. If you run your own deployment, check GEMINI_API_KEY in your environment variables.",
  "troubleshooting.g2e6Error": "Could not save that image.",
  "troubleshooting.g2e6What": "Attaching a receipt photo to an existing transaction failed.",
  "troubleshooting.g2e6Why": "A server-side error while saving — the transaction itself is unaffected.",
  "troubleshooting.g2e6Fix": "Try attaching again in a moment. If it keeps failing, report it — see Error log in Settings.",
  "troubleshooting.g3e1Error": "Gemini is busy right now.",
  "troubleshooting.g3e1What": "A scan or recording failed with this message.",
  "troubleshooting.g3e1Why": "Gemini's API is temporarily overloaded or rate-limiting requests.",
  "troubleshooting.g3e1Fix": "Wait a moment and try again — this is transient, not something wrong with your input.",
  "troubleshooting.g3e2Error": "Daily scan limit reached.",
  "troubleshooting.g3e2What": "Scanning or voice entry stopped working for the rest of the day.",
  "troubleshooting.g3e2Why": "A per-account daily cap on Gemini calls, to bound cost from runaway/scripted usage.",
  "troubleshooting.g3e2Fix": "Use manual entry for the rest of the day; the limit resets after 24 hours.",
  "troubleshooting.g4e1Error": "You're offline.",
  "troubleshooting.g4e1What": "An action failed instantly.",
  "troubleshooting.g4e1Why": "Your device has no network connection.",
  "troubleshooting.g4e1Fix": "Reconnect and try again. Tally can be installed for a graceful offline page, but doesn't support offline data entry yet.",
  "troubleshooting.g4e2Error": "That took too long and timed out.",
  "troubleshooting.g4e2What": "An action hung, then failed.",
  "troubleshooting.g4e2Why": "The request was aborted after taking too long — usually a slow or unstable connection.",
  "troubleshooting.g4e2Fix": "Check your connection and try again.",
  "troubleshooting.g4e3Error": "Couldn't reach the server.",
  "troubleshooting.g4e3What": "An action failed without a specific server response.",
  "troubleshooting.g4e3Why": "A connection-level failure (DNS, blocked request, etc.) that the browser doesn't detail further.",
  "troubleshooting.g4e3Fix": "Check your connection; if it persists on a stable connection, report it — see Error log in Settings.",
  "troubleshooting.g4e4Error": "Too many requests. Slow down and try again shortly.",
  "troubleshooting.g4e4What": "Several actions in a row suddenly started failing.",
  "troubleshooting.g4e4Why": "A short-term rate limit protecting the app from being hammered by one account.",
  "troubleshooting.g4e4Fix": "Wait about 10 seconds and try again — normal use rarely hits this.",
  "troubleshooting.g5e1Error": "Incorrect username or password.",
  "troubleshooting.g5e1What": "Login failed.",
  "troubleshooting.g5e1Why": "Exactly what it says — but shown identically whether the username exists or not, so it can't be used to check which usernames are registered.",
  "troubleshooting.g5e1Fix": "Double-check your username/password, or use \"Forgot password?\" if you've set an email on the account.",
  "troubleshooting.g5e2Error": "Too many attempts. Try again later.",
  "troubleshooting.g5e2What": "Login stopped accepting attempts.",
  "troubleshooting.g5e2Why": "Rate limiting after repeated failed logins for that username, to slow down password guessing.",
  "troubleshooting.g5e2Fix": "Wait 15 minutes, or use \"Forgot password?\" if you have an email set on the account.",
  "troubleshooting.g5e3Error": "That username is already taken.",
  "troubleshooting.g5e3What": "Registration or a username change was rejected.",
  "troubleshooting.g5e3Why": "Someone (possibly you, on an earlier attempt) already has that exact username.",
  "troubleshooting.g5e3Fix": "Pick a different username, or sign in instead if the account is yours.",
  "troubleshooting.g5e4Error": "That reset link is invalid or has expired.",
  "troubleshooting.g5e4What": "A password reset link didn't work.",
  "troubleshooting.g5e4Why": "Reset links expire after 1 hour and are single-use — requesting a new one invalidates any older link.",
  "troubleshooting.g5e4Fix": "Go back to \"Forgot password?\" and request a fresh link.",
  "troubleshooting.whatHappenedLabel": "What happened:",
  "troubleshooting.whyLabel": "Why:",
  "troubleshooting.fixLabel": "Fix or bypass:",
  "usageGuide.title": "Usage Guide",
  "usageGuide.subtitle": "Everything Tally can do, in one place.",
  "usageGuide.s1Title": "Signing in",
  "usageGuide.s1Part1": "Sign up with a username and password, or use",
  "usageGuide.s1Part2": "on the sign-in/sign-up screen. Already have a username/password account? Link GitHub to it (or unlink it later) from",
  "usageGuide.s1Part3": "— unlinking is blocked if the account has no password set, so you're never left with no way back in.",
  "usageGuide.s2Title": "Adding a transaction",
  "usageGuide.s2Part1": "Tap",
  "usageGuide.s2Part2": "from the Dashboard or Activities page — or tap the Income/Expenses card on the Dashboard to jump straight to Add with that type pre-selected. You have three ways to log a transaction:",
  "usageGuide.s2Li1Label": "Manual entry",
  "usageGuide.s2Li1Body": "fill in date, amount, merchant, category, tags, and notes yourself.",
  "usageGuide.s2Li2Label": "Scan a document",
  "usageGuide.s2Li2Body": "take a photo or upload an image of a receipt, payslip, or invoice; Gemini reads the details and pre-fills the form for you to review before saving. Select multiple images to batch-scan them one after another.",
  "usageGuide.s2Li3Label": "Speak",
  "usageGuide.s2Li3Body": "tap the mic and describe the transaction out loud (e.g. \"spent 12 dollars on coffee at Starbucks today\"); it's transcribed and extracted the same way.",
  "usageGuide.s3Title": "Automatic receipt import",
  "usageGuide.s3Part1": "For receipts you'd rather not scan by hand one at a time: create a personal access token in",
  "usageGuide.s3Part2": ", then set up an iOS Shortcut (fully automatic when a photo lands in a chosen album, or a one-tap Share Sheet variant) or the Android share sheet, following the setup steps shown there. Imported transactions are tagged",
  "usageGuide.s3Part3": "and keep the original photo attached, so you can filter by that tag in Activities to spot-check anything misread.",
  "usageGuide.s4Title": "Wallets",
  "usageGuide.s4Part1": "Track balances across multiple cash/bank/e-wallet pools from",
  "usageGuide.s4Span": "default wallet for Activities",
  "usageGuide.s4Part2": ". Transfer money between your own wallets (doesn't count as income or spending), set a default wallet for new transactions, archive ones you no longer use without losing their history, and label each with its own currency. You can also set a",
  "usageGuide.s4Part3": "— which wallet its balance card and transaction list are scoped to when the page opens, separate from the default used for new transactions.",
  "usageGuide.sPassesTitle": "Wallet passes & cards",
  "usageGuide.sPassesPart1": "Keep loyalty cards, coupons, event tickets, boarding passes, gift cards, and transit passes in",
  "usageGuide.sPassesSpan": "Wallet",
  "usageGuide.sPassesPart2": ", each with a QR/barcode, custom fields you name yourself, and an attachable logo/banner. Pick a look from the gallery of admin-reviewed premade pass designs, or submit your own for others to use.",
  "usageGuide.s5Title": "Recurring transactions, budgets & savings goals",
  "usageGuide.s5Part1": "All under",
  "usageGuide.s5Part2": ". Recurring rules auto-log rent, subscriptions, or salary on a weekly/monthly/yearly schedule — pause, edit, skip a single upcoming occurrence, or reorder them. Budgets set a monthly spending limit per category, with an optional rollover of unused budget into the next month and a Dashboard alert when you're near or over. Savings goals track progress toward something you're saving for, with manual contribute/withdraw.",
  "usageGuide.s6Title": "Split transactions",
  "usageGuide.s6Part1": "From",
  "usageGuide.s6Part2": "split one receipt across multiple categories in a single entry — it shows up as one grouped card in Activities, with each line still individually editable or deletable.",
  "usageGuide.s7Title": "Analytics",
  "usageGuide.s7Body": "Fully customizable — tap the paintbrush icon to enter the live editor, then add, remove, resize, or reorder any of 50+ widgets (stat cards, trend charts, progress rings, donut charts, heatmaps, leaderboards, and more) to build your own layout. Widgets you haven't customized are updated with new sensible defaults over time; once you've arranged your own, it's yours to keep.",
  "usageGuide.s8Title": "Activities",
  "usageGuide.s8Part1": "Your full transaction log. The balance card up top shows your wallet balance, with Expense/Income/Transfer buttons that filter the list below and a wallet-scope picker to view one wallet instead of all of them. The filter icon next to search opens Category, Tag, Wallet, and Date range filters, and you can export the currently filtered list as a CSV. Tap any transaction to open a read-only detail view — its category, wallet, tags, notes, and attached receipt — with an",
  "usageGuide.s8Span": "Edit transaction",
  "usageGuide.s8Part2": "button if you actually want to change it, so a stray tap can't put you into editing by accident. Select multiple transactions to bulk-delete or bulk-tag them at once, or on mobile, swipe a transaction left or right for quick delete/share.",
  "usageGuide.s9Title": "Settings",
  "usageGuide.s9Body": "Manage your account (username, password, email, connected GitHub account, account deletion, sign out of all devices), grant microphone/camera/photos permissions and manage email notifications, customize your expense and income categories and tags, switch light/dark theme, import/export CSV data, set your default currency (with optional automatic conversion for scanned, spoken, or Dashboard amounts in a different currency), and check the Error log if Tally has shown you an error message you want to report.",
  "usageGuide.s10Title": "Install & use offline",
  "usageGuide.s10Body": "Tally is an installable app — add it to your home screen from your browser's share/install menu. Once installed, it opens instantly, and if you open it with no connection you'll see a graceful offline page instead of an error (viewing existing data offline isn't supported yet).",
  "nav.home": "Home",
  "nav.activities": "Activities",
  "nav.settings": "Settings",
  "nav.memberships": "Memberships",
  "membership.codeRenderError": "Couldn't render this code — check the value and format.",
  "membership.editTitle": "Edit card",
  "membership.addCard": "Add loyalty card",
  "membership.nameLabel": "Shop or restaurant",
  "membership.namePlaceholder": "e.g. Starbucks",
  "membership.codeLabel": "Card number",
  "membership.scanInstead": "Scan instead",
  "membership.codePlaceholder": "The number or code on your card",
  "membership.formatLabel": "Code type",
  "membership.formatQr": "QR code",
  "membership.formatCode128": "Barcode (Code 128)",
  "membership.formatEan13": "Barcode (EAN-13)",
  "membership.formatUpc": "Barcode (UPC-A)",
  "membership.colorLabel": "Color",
  "membership.iconLabel": "Icon",
  "membership.notesLabel": "Notes",
  "membership.notesPlaceholder": "Member ID, expiry, or anything else worth remembering",
  "membership.tabCode": "Code",
  "membership.tabFields": "Fields",
  "membership.scanUnsupported": "This browser doesn't support camera scanning.",
  "membership.scanTitle": "Scan a card",
  "membership.scanPhotoError": "Couldn't find a code in that photo. Try a clearer picture or type it in.",
  "membership.cropTitle": "Crop image",
  "membership.cropReset": "Reset",
  "membership.cropLoadError": "Couldn't load that image. Try a different photo.",
  "membership.cropSaveError": "Couldn't crop that image. Try again.",
  "membership.cropHintFreeform": "Drag to move, pinch or scroll to zoom, drag a corner to resize.",
  "membership.cropHintFixed": "Drag to move, pinch or scroll to zoom.",
  "membership.choosePhoto": "Choose from photos",
  "membership.decodingPhoto": "Reading photo…",
  "membership.formatPdf417": "PDF417 code",
  "membership.formatAztec": "Aztec code",
  "membership.previewLabel": "Preview",
  "membership.templateGeneric": "Generic",
  "membership.templateStoreCard": "Store card",
  "membership.templateCoupon": "Coupon",
  "membership.templateEventTicket": "Event ticket",
  "membership.templateBoardingPass": "Boarding pass",
  "membership.templateGiftCard": "Gift card",
  "membership.templateTransitPass": "Transit pass",
  "membership.fieldPointsBalance": "Points balance",
  "membership.fieldPointsBalancePlaceholder": "e.g. 1,240 pts",
  "membership.fieldMemberSince": "Member since",
  "membership.fieldMemberSincePlaceholder": "e.g. 2021",
  "membership.fieldDiscount": "Discount",
  "membership.fieldDiscountPlaceholder": "e.g. 20% off",
  "membership.fieldExpiry": "Expires",
  "membership.fieldExpiryPlaceholder": "e.g. 2026-12-31",
  "membership.fieldEventDate": "Event date",
  "membership.fieldEventDatePlaceholder": "e.g. Sep 1, 2026",
  "membership.fieldVenue": "Venue",
  "membership.fieldVenuePlaceholder": "e.g. Rajamangala Stadium",
  "membership.fieldSeat": "Seat",
  "membership.fieldSeatPlaceholder": "e.g. 12A",
  "membership.fieldBalance": "Balance",
  "membership.fieldBalancePlaceholder": "e.g. $25.00",
  "membership.fieldRidesRemaining": "Rides remaining",
  "membership.fieldRidesRemainingPlaceholder": "e.g. 8",
  "membership.fieldFrom": "From",
  "membership.fieldFromPlaceholder": "e.g. BKK",
  "membership.fieldTo": "To",
  "membership.fieldToPlaceholder": "e.g. NRT",
  "membership.fieldGate": "Gate",
  "membership.fieldGatePlaceholder": "e.g. 22",
  "membership.fieldBoardingTime": "Boarding time",
  "membership.fieldBoardingTimePlaceholder": "e.g. 14:30",
  "membership.fieldMemberId": "Member ID",
  "membership.fieldMemberIdPlaceholder": "e.g. 12345",
  "membership.kindLabel": "Type",
  "membership.editorGuided": "Guided",
  "membership.editorCustom": "Custom layout",
  "membership.zoneHeader": "Header",
  "membership.zonePrimary": "Main",
  "membership.zoneSecondary": "Secondary",
  "membership.zoneAuxiliary": "Extra",
  "membership.availableFields": "Available fields",
  "membership.tapFieldHint": "Tap a field below, then tap + to place it",
  "membership.addFieldHere": "Add field here",
  "membership.newFieldLabel": "Add a custom field",
  "membership.newFieldPlaceholder": "e.g. Locker number",
  "membership.newFieldAdd": "Add",
  "membership.newFieldLimitReached": "You've reached the limit of custom fields for one pass.",
  "membership.removeCustomField": "Remove field",
  "membership.hideFieldLabel": "Hide label",
  "membership.showLogoOnCardLabel": "Show logo on card",
  "membership.lockLogoLabel": "Lock logo",
  "membership.lockLogoDesc": "Anyone who picks this template gets its logo locked in and can't change or remove it.",
  "membership.lockBannerLabel": "Lock banner",
  "membership.lockBannerDesc": "Anyone who picks this template gets its banner locked in and can't change or remove it.",
  "membership.lockFieldsLabel": "Lock fields",
  "membership.lockFieldsDesc": "Anyone who picks this template keeps its field layout as-is — only the field values can be changed.",
  "membership.showNameOnCardLabel": "Show name on card",
  "membership.showCodeTextLabel": "Show code text",
  "membership.premadePassesLabel": "Premade passes",
  "membership.uploadPassTemplateDesc": "Submit this pass's look as a premade design for others to pick, once approved.",
  "membership.viewPassGuidelinesLink": "View pass design guidelines",
  "passGuidelines.title": "Pass design guidelines",
  "passGuidelines.intro": "Reference specs for anyone designing a pass look to submit as a Premade Pass template — how it's shaped, sized, and laid out, straight from the component every pass in the app renders through.",
  "passGuidelines.logoHeightLabel": "logo height",
  "passGuidelines.logoWidthLabel": "logo max width",
  "passGuidelines.bannerHeightLabel": "banner max height",
  "passGuidelines.cornerRadiusLabel": "corner radius",
  "passGuidelines.shapeHeading": "Shape & sizing",
  "passGuidelines.shapeBody": "Unlike a wallet card, a pass has no single fixed aspect ratio — its width fills whatever it's shown in (a phone-width modal, a capped dialog), but its height is content-driven: it grows or shrinks with the header, an optional banner, the fields your pass kind defines, and the code at the bottom.\nCorners are rounded 16px, matching every other card-shaped surface in the app.",
  "passGuidelines.assetsHeading": "Logo & banner",
  "passGuidelines.assetsBody": "Both images crop freeform — there's no fixed box, so whatever you crop to becomes that image's own shape. The logo renders at a fixed 36px height (auto width, capped at 112px), so a roughly square or wide mark reads best; a very tall one will get capped narrow. The banner runs full-bleed edge to edge under the header at its own width-to-height ratio, capped at 224px tall — a wide, landscape image (think a boarding-pass photo strip) works better than a tall one, which would just hit the height cap and look narrow.",
  "passGuidelines.layoutHeading": "Fields & layout",
  "passGuidelines.layoutBody": "A pass has four field zones: header (top row, next to the logo/name — a boarding pass's FROM/TO lives here), primary (one large hero value below the header, like a coupon's discount or a gift card's balance), and secondary/auxiliary (paired label/value rows lower down). Ticket-like kinds (coupon, event ticket, boarding pass, transit pass) get a dashed tear-off divider before those lower rows; a plain card (generic, store card) doesn't. The code (QR/barcode) always renders last, at the bottom.",
  "passGuidelines.kindCategoryHeading": "Kind vs. category",
  "passGuidelines.kindCategoryBody": "When submitting, you'll pick two independent things: Kind is the structural shape — which fields exist and whether there's a tear-off stub (generic, store card, coupon, event ticket, boarding pass, gift card, transit pass). Category is the industry it's for (airline, hotel, retail, dining, transit, entertainment, other) — used purely to group the gallery. An airline's boarding pass and an airline's loyalty card share a category but not a kind.",
  "passGuidelines.colorHeading": "Color & contrast",
  "passGuidelines.colorBody": "The pass face itself uses the same pattern/gradient/color background as wallet cards, separate from the logo and banner images — text color auto-contrasts against it unless overridden. Since the code area renders on plain white regardless of the pass's own colors, only the header/field text needs to stay readable against your chosen background.",
  "passGuidelines.checklistHeading": "Before you submit",
  "passGuidelines.checklistBody": "- Preview with real-length sample text in every field you've placed — a name or value much longer than your placeholder can wrap or truncate differently than expected.\n- Confirm the logo and banner still read clearly once auto-contrasted text sits over them.\n- Pick a name that describes the look itself (e.g. \"Midnight Wave\"), not a specific brand.\n- Submissions are reviewed before appearing in Premade Passes for everyone.",
  "membership.passTemplateReviewTitle": "Manage Passes",
  "membership.passTemplateCategoryLabel": "Category",
  "membership.passCategoryAirline": "Airline",
  "membership.passCategoryHotel": "Hotel",
  "membership.passCategoryRetail": "Retail",
  "membership.passCategoryDining": "Dining",
  "membership.passCategoryTransit": "Transit",
  "membership.passCategoryEntertainment": "Entertainment",
  "membership.passCategoryOther": "Other",
  "membership.entryTitle": "Create pass",
  "membership.entryNewPass": "New pass",
  "membership.fileImportUnsupported": "Only image files are supported right now.",
  "membership.editorTitle": "Pass editor",
  "membership.addLogo": "Add logo",
  "nav.wallet": "Wallet",
  "wallet.tabAccounts": "Accounts",
  "wallet.tabCards": "Cards",
  "wallet.tabPasses": "Passes",
  "wallet.tabMemberships": "Memberships",
  "wallet.cardsSubtitle": "Payment cards you keep for reference",
  "wallet.cardsEmptyTitle": "No cards yet",
  "wallet.cardsEmptyDesc": "Add a card to keep its look and details handy",
  "wallet.addCard": "Add payment card",
  "wallet.editCard": "Edit card",
  "wallet.addPass": "Add pass",
  "wallet.editPass": "Edit pass",
  "wallet.labelLabel": "Label",
  "wallet.labelPlaceholder": "e.g. Personal Visa",
  "wallet.networkLabel": "Network",
  "wallet.networkVisa": "Visa",
  "wallet.networkMastercard": "Mastercard",
  "wallet.networkAmex": "Amex",
  "wallet.networkDiscover": "Discover",
  "wallet.networkOther": "Other",
  "wallet.networkJcb": "JCB",
  "wallet.networkUnionPay": "UnionPay",
  "wallet.networkApplePay": "Apple Pay",
  "wallet.last4Label": "Last 4 digits",
  "wallet.last4Hint": "Only the last 4 digits are stored — never the full card number",
  "wallet.holderLabel": "Cardholder",
  "wallet.holderPlaceholder": "Name on card",
  "wallet.expiryLabel": "Expiry",
  "wallet.expiryMonthLabel": "Expiry month",
  "wallet.expiryYearLabel": "Expiry year",
  "wallet.passesSubtitle": "Tickets, coupons, and boarding passes",
  "wallet.entryTitle": "Add to Wallet",
  "wallet.entryAccountDesc": "A bank or cash account",
  "wallet.entryCardDesc": "A payment card, for reference",
  "wallet.entryPassDesc": "A ticket, coupon, or boarding pass",
  "wallet.entryMembershipDesc": "A loyalty or store card",
  "wallet.entryWalletDesc": "A bank/cash account, or a payment card",
  "wallet.entryPassCombinedDesc": "A ticket, coupon, boarding pass, or loyalty card",
  "wallet.kindAccountLabel": "Bank or cash account",
  "wallet.kindCardLabel": "Payment card",
  "wallet.manageAccounts": "Manage accounts",
  "wallet.stackEmptyTitle": "Your wallet is empty",
  "wallet.stackEmptyDesc": "Add an account, card, pass, or membership to get started",
  "color.custom": "Custom",
  "color.hex": "Hex",
  "color.rgb": "RGB",
  "color.cmyk": "CMYK",
  "color.eyedropper": "Pick color from screen",
  "background.plain": "Plain color",
  "background.patternDiagonal": "Diagonal",
  "background.patternRadialGlow": "Radial glow",
  "background.patternWave": "Wave",
  "background.patternDots": "Dot grid",
  "background.patternStripes": "Stripes",
  "background.patternTriangles": "Geometric",
  "background.patternGrid": "Grid",
  "background.patternSheen": "Metallic sheen",
  "background.patternTopographic": "Topographic",
  "background.patternConfetti": "Confetti",
  "background.patternDiagonalSplit": "Diagonal Split",
  "background.patternRibbonFold": "Ribbon Fold",
  "background.patternLoopKnot": "Loop Knot",
  "background.patternSpiralCoil": "Spiral Coil",
  "background.patternRadialBurst": "Radial Burst",
  "background.patternColorBlocks": "Color Blocks",
  "background.patternBrushedMetal": "Brushed Metal",
  "background.patternGuilloche": "Guilloché",
  "background.patternCarbonFiber": "Carbon Fiber",
  "background.patternConcentricRings": "Concentric Rings",
  "background.patternHoloWave": "Holo Wave",
  "background.patternMicroEmboss": "Micro Emboss",
  "background.patternScallopWave": "Scallop Wave",
  "background.patternPetalBloom": "Petal Bloom",
  "background.patternFloatingSquares": "Floating Squares",
  "background.patternOvalCluster": "Oval Cluster",
  "background.patternFragmentShards": "Fragment Shards",
  "background.patternInkBlob": "Ink Blob",
  "background.patternMarbleSwirl": "Marble Swirl",
  "background.patternSpeckleSplash": "Speckle Splash",
  "background.patternAuroraHalo": "Aurora Halo",
  "background.patternCircuitMaze": "Circuit Maze",
  "background.patternNeonRibbon": "Neon Ribbon",
  "background.patternPrismShard": "Prism Shard",
  "background.patternBannerFold": "Banner Fold",
  "background.patternWavyLines": "Wavy Lines",
  "background.patternTearDrop": "Tear Drop",
  "background.patternChevronBolt": "Chevron Bolt",
  "background.patternCosmicStreak": "Cosmic Streak",
  "background.patternDiagonalGrain": "Diagonal Grain",
  "background.patternLiquidRibbon": "Liquid Ribbon",
  "background.patternHalfMoonGlow": "Half-Moon Glow",
  "background.patternInkSplatter": "Ink Splatter",
  "background.patternDiamondLattice": "Diamond Lattice",
  "background.patternSunburstRays": "Sunburst Rays",
  "background.patternZigzagPulse": "Zigzag Pulse",
  "background.patternHexGrid": "Hex Grid",
  "background.patternGemFacet": "Gem Facet",
  "background.patternCloudDrift": "Cloud Drift",
  "background.patternArcBands": "Arc Bands",
  "background.patternPixelMosaic": "Pixel Mosaic",
  "background.patternFlameGradient": "Flame Gradient",
  "background.patternCurvedWing": "Curved Wing",
  "background.patternSunFan": "Sun Fan",
  "background.patternArrowGlint": "Arrow Glint",
  "background.patternDotFan": "Dot Fan",
  "background.colorSlot1": "Color 1",
  "background.colorSlot2": "Color 2",
  "background.colorSlot3": "Color 3",
  "background.scanCard": "Scan a card",
  "background.editColors": "Edit colors",
  "background.colorsLockedDesc": "This pattern's colors are locked to keep the artwork looking as designed — tap \"Edit colors\" to change them.",
  "background.colorsLockedByTemplateDesc": "This template's colors are locked in and can't be changed.",
  "background.scanTitle": "Scan a card",
  "background.scanHint": "Photograph a real card to pull a background from it — you'll be able to fix the angle before we use it.",
  "background.scanLoadError": "Couldn't read that photo. Try another one.",
  "background.takePhoto": "Take a photo",
  "background.choosePhoto": "Choose from gallery",
  "background.adjustTitle": "Adjust the corners",
  "background.adjustHint": "Drag the corners so they line up with the edges of the card.",
  "background.resetGuide": "Reset guide",
  "background.useThisArea": "Use this area",
  "background.resultTitle": "Pick a look",
  "background.extractedColors": "Colors from your photo",
  "background.chooseLook": "Choose a pattern",
  "background.useThisLook": "Use this look",
  "background.back": "Back",
  "background.useDirectTitle": "Use the photo directly",
  "background.useDirectHint": "The corrected photo becomes the background, exactly as scanned.",
  "background.useThisPhoto": "Use this photo",
  "background.aiGenerateTitle": "Generate an AI pattern",
  "background.aiGenerateHint": "Ask AI to create a new abstract pattern inspired by this card's colors and style — not a copy of it.",
  "background.generatePattern": "Generate pattern",
  "background.generating": "Generating…",
  "background.regenerate": "Regenerate",
  "background.useThisPattern": "Use this pattern",
  "background.aiGenerateError": "Couldn't generate a pattern. Try again, or use one of the other options.",
  "background.textColorLabel": "Text color",
  "wallet.iconColorLabel": "Badge color",
  "wallet.iconColorDesc": "Colors the network badge/logo — leave unset to match the text color above.",
  "wallet.iconColorUseOriginal": "Use original logo colors",
  "wallet.iconColorOriginalActive": "Showing original logo colors",
  "wallet.iconColorCustomize": "Customize color",
  "background.textColorAuto": "Auto",
  "membership.addBanner": "Add banner",
  "membership.removeImage": "Remove image",
  "membership.typeItInstead": "Type it in instead",
  "membership.title": "Memberships",
  "membership.subtitle": "Loyalty and membership cards, ready to scan",
  "membership.emptyTitle": "No cards yet",
  "membership.emptyDesc": "Tap + to add a shop or restaurant's membership card.",
  "membership.couldNotDelete": "Could not delete that card.",
  "membership.noCardSelected": "No card selected",
  "membership.noCardSelectedDesc": "Choose a card from the list to see its code.",
  "nav.add": "Add",
  "settings.section.appSettings": "Account",
  "settings.section.records": "Money",
  "settings.section.organize": "Organize",
  "settings.section.data": "Data & Backup",
  "settings.section.social": "Social",
  "settings.section.display": "Display",
  "settings.section.tools": "Tools",
  "settings.section.ai": "AI & Tools",
  "settings.aiUsage": "AI usage & models",
  "ai.usageTitle": "AI usage & models",
  "ai.usageTodayLabel": "Used today",
  "ai.usageDescription": "Receipt scanning, voice entry, the assistant, and card-pattern generation share one daily limit. It resets 24 hours after each use, not at midnight.",
  "ai.modelsTitle": "Which model powers what",
  "ai.modelsDescription": "Every AI feature in Tally runs on Google Gemini — nothing is sent to any other AI provider.",
  "ai.fallbackHint": "falls back to",
  "ai.fallbackExplainer": "When the main model is rate-limited, these features automatically retry on a lighter model with its own separate free quota, so a busy moment doesn't just fail outright.",
  "ai.featureScan": "Receipt scanning",
  "ai.featureVoice": "Voice entry",
  "ai.featureAssistant": "Assistant",
  "ai.featurePattern": "Card pattern generation",
  "settings.codeScanner": "Code scanner",
  "settings.currencyConverter": "Currency converter",
  "settings.discountCalculator": "Discount / tip calculator",
  "settings.loanCalculator": "Loan calculator",
  "codeScanner.title": "Code scanner",
  "codeScanner.description": "Scan any QR code or barcode with your camera and read back the value it encodes.",
  "codeScanner.scanButton": "Scan a code",
  "codeScanner.scanAnother": "Scan another",
  "codeScanner.copy": "Copy",
  "codeScanner.copied": "Copied!",
  "currencyConverter.title": "Currency converter",
  "currencyConverter.amountLabel": "Amount",
  "currencyConverter.fromLabel": "From",
  "currencyConverter.toLabel": "To",
  "currencyConverter.swap": "Swap currencies",
  "currencyConverter.converting": "Converting...",
  "currencyConverter.enterAmount": "Enter an amount to convert.",
  "currencyConverter.error": "Could not convert. Try again.",
  "discountCalculator.title": "Discount / tip calculator",
  "discountCalculator.modeDiscount": "Discount",
  "discountCalculator.modeTip": "Tip",
  "discountCalculator.priceLabel": "Original price",
  "discountCalculator.billLabel": "Bill amount",
  "discountCalculator.discountPercentLabel": "Discount %",
  "discountCalculator.tipPercentLabel": "Tip %",
  "discountCalculator.splitLabel": "Split between (people)",
  "discountCalculator.enterValues": "Enter an amount and a percentage.",
  "discountCalculator.youSave": "You save",
  "discountCalculator.finalPrice": "Final price",
  "discountCalculator.tipAmount": "Tip amount",
  "discountCalculator.total": "Total",
  "discountCalculator.perPerson": "Per person",
  "loanCalculator.title": "Loan calculator",
  "loanCalculator.principalLabel": "Loan amount",
  "loanCalculator.rateLabel": "Annual interest rate (%)",
  "loanCalculator.monthsLabel": "Term (months)",
  "loanCalculator.enterValues": "Enter a loan amount, rate, and term.",
  "loanCalculator.monthlyPayment": "Monthly payment",
  "loanCalculator.totalPaid": "Total paid",
  "loanCalculator.totalInterest": "Total interest",
  "loanCalculator.disclaimer": "This is just a calculator — it doesn't create or affect a saved loan.",
  "settings.section.support": "Support",
  "settings.section.admin": "Admin",
  "settings.account": "Account",
  "settings.permissions": "Permissions",
  "settings.manageCategories": "Manage categories",
  "settings.manageTags": "Manage tags",
  "settings.vendors": "Vendors",
  "settings.activities": "Activities",
  "settings.wallets": "Wallets",
  "settings.friends": "Friends & Family",
  "settings.challenges": "Challenges",
  "settings.splitBills": "Split bills",
  "settings.loans": "Loans",
  "settings.assistant": "Assistant",
  "assistant.title": "Assistant",
  "assistant.description": "Ask a question about your spending — answers are always based on your real transactions.",
  "assistant.placeholder": "Ask about your spending…",
  "ai.modelUsed": "Extracted with {model} — double-check the details above.",
  "ai.answeredBy": "Answered by {model} — verify important numbers.",
  "assistant.ask": "Ask",
  "reports.title": "Monthly report",
  "reports.description": "Download a PDF summary of this month's income, expenses, and spending by category.",
  "reports.exporting": "Exporting…",
  "reports.download": "Download PDF",
  "settings.backup": "Backup & restore",
  "settings.codeGenerator": "Code generator",
  "codeGenerator.title": "Code generator",
  "codeGenerator.inputLabel": "Text or link",
  "codeGenerator.inputDescription": "Paste a link (or any text) and turn it into a scannable QR code or barcode.",
  "codeGenerator.inputPlaceholder": "https://example.com or any text",
  "codeGenerator.previewLabel": "Preview",
  "codeGenerator.emptyHint": "Enter some text or a link above to generate a code.",
  "codeGenerator.downloadLabel": "Download",
  "codeGenerator.downloadAs": "Download as {format}",
  "membership.codeLinkHint": "A link works too — pick QR or Aztec below to encode it.",
  "backup.title": "Backup & restore",
  "backup.export.title": "Export backup",
  "backup.export.description": "Download an encrypted copy of your data (transactions, wallets, budgets, and more) to a passphrase-protected file.",
  "backup.export.passphrasePlaceholder": "Passphrase (min. 8 characters)",
  "backup.export.confirmPlaceholder": "Confirm passphrase",
  "backup.export.button": "Export backup",
  "backup.export.exporting": "Exporting…",
  "backup.export.done": "Backup downloaded. Keep your passphrase safe — it can't be recovered.",
  "backup.export.tooShort": "Passphrase must be at least 8 characters.",
  "backup.export.mismatch": "Passphrases don't match.",
  "backup.export.failed": "Could not export your data.",
  "backup.import.title": "Import backup",
  "backup.import.description": "Restore data from a Tally backup file. Existing data is never overwritten — everything is added as new.",
  "backup.import.passphrasePlaceholder": "Passphrase",
  "backup.import.button": "Import backup",
  "backup.import.importing": "Importing…",
  "backup.import.notABackup": "This doesn't look like a Tally backup file.",
  "backup.import.failed": "Could not import that file.",
  "backup.import.resultPrefix": "Imported",
  "backup.import.skippedLabel": "skipped",
  "settings.appLock": "App lock",
  "appLock.title": "App lock",
  "appLock.description": "Add a biometric lock (Face ID, Touch ID, or your device's screen unlock) or a numeric passcode on top of your regular sign-in. This protects the app on this device — it doesn't replace your password.",
  "appLock.unsupported": "This browser doesn't support biometric unlock.",
  "appLock.loading": "Loading…",
  "appLock.toggleLabel": "Require unlock to open the app",
  "appLock.toggleHint": "Applies next time the app opens or comes back from the background.",
  "appLock.devicesTitle": "Enrolled devices",
  "appLock.noDevices": "No devices enrolled yet.",
  "appLock.unnamedDevice": "Unnamed device",
  "appLock.remove": "Remove",
  "appLock.enrolling": "Adding device…",
  "appLock.addDevice": "Add this device",
  "appLock.enrollFailed": "Could not add this device.",
  "appLock.toggleFailed": "Could not update that setting.",
  "appLock.removeFailed": "Could not remove that device.",
  "appLock.gate.title": "Tally is locked",
  "appLock.gate.description": "Unlock with your device's biometrics or screen lock to continue.",
  "appLock.gate.unlock": "Unlock",
  "appLock.gate.unlocking": "Unlocking…",
  "appLock.gate.failed": "Could not unlock. Try again.",
  "appLock.gate.signOut": "Sign out instead",
  "offline.banner.offline": "You're offline",
  "offline.banner.offlineQueued": "You're offline — {count} change(s) queued",
  "offline.banner.syncing": "Syncing… {count} remaining",
  "offline.banner.failed": "{count} change(s) couldn't sync",
  "offline.banner.synced": "All changes synced",
  "appLock.pin.title": "Passcode",
  "appLock.pin.description": "A 4-8 digit numeric passcode — an alternative to biometrics for unlocking on this device.",
  "appLock.pin.set": "Passcode is set",
  "appLock.pin.change": "Change",
  "appLock.pin.newPlaceholder": "New passcode (4-8 digits)",
  "appLock.pin.confirmPlaceholder": "Confirm passcode",
  "appLock.pin.save": "Save passcode",
  "appLock.pin.saving": "Saving…",
  "appLock.pin.cancel": "Cancel",
  "appLock.pin.invalid": "Passcode must be 4-8 digits.",
  "appLock.pin.mismatch": "Passcodes don't match.",
  "appLock.pin.saveFailed": "Could not save that passcode.",
  "appLock.pin.removeFailed": "Could not remove that passcode.",
  "appLock.gate.pinPlaceholder": "Enter passcode",
  "appLock.gate.pinFailed": "Incorrect passcode. Try again.",
  "appLock.gate.usePin": "Use passcode instead",
  "appLock.gate.useBiometric": "Use biometrics instead",
  "appLock.timeout.label": "Lock after",
  "appLock.timeout.hint": "How long the app can sit in the background before it locks again when you return.",
  "appLock.timeout.immediately": "Immediately",
  "appLock.timeout.1min": "1 minute",
  "appLock.timeout.5min": "5 minutes",
  "appLock.timeout.15min": "15 minutes",
  "appLock.timeout.1hour": "1 hour",
  "appLock.timeout.saveFailed": "Could not save that setting.",
  "settings.referFriend": "Refer a friend",
  "refer.title": "Invite friends to Tally",
  "refer.subtitle": "Share your invite so a friend can start tracking their own spending.",
  "refer.qrCaption": "Scan to open the sign-up page",
  "refer.copy": "Copy link",
  "refer.copied": "Copied",
  "refer.share": "Share invite",
  "refer.shareText": "Track your spending with Tally — join me!",
  "refer.embedTitle": "Embed on your website",
  "refer.embedHint": "Add this invite card to your own site or blog with an iframe.",
  "refer.embedCopy": "Copy embed code",
  "friends.owesYou": "Owes you",
  "friends.youOwe": "You owe",
  "recurring.suggestions.title": "Suggested recurring transactions",
  "recurring.suggestions.hint": "Based on transactions that seem to repeat on a regular schedule.",
  "recurring.suggestions.seenTimes": "Seen {count} times",
  "recurring.suggestions.dismiss": "Dismiss",
  "recurring.suggestions.add": "Add",
  "settings.pendingChanges": "Pending changes",
  "pendingChanges.title": "Pending changes",
  "pendingChanges.description": "Changes made offline that are queued to sync, or that failed and need your attention.",
  "pendingChanges.empty": "Nothing queued right now.",
  "pendingChanges.pendingTitle": "Waiting to sync",
  "pendingChanges.syncNow": "Sync now",
  "pendingChanges.failedTitle": "Couldn't sync",
  "pendingChanges.retry": "Retry",
  "pendingChanges.discard": "Discard",
  "split.recurring.title": "Recurring splits",
  "split.recurring.add": "New recurring split",
  "split.recurring.titlePlaceholder": "e.g. Rent",
  "split.recurring.save": "Save",
  "split.recurring.needParticipant": "Pick at least one friend to split with.",
  "split.recurring.saveFailed": "Could not save that recurring split.",
  "recurring.pause": "Pause",
  "recurring.resume": "Resume",
  "notifications.saveFailed": "Could not save.",
  "notifications.pushTitle": "Push notifications",
  "notifications.loanRemindersTitle": "Loan payment reminders",
  "notifications.loanRemindersDesc": "A notification on this device when a loan installment is due, even if the app isn't open.",
  "loans.title": "Loans",
  "loans.description": "Track money you've lent or borrowed, with an optional payoff schedule.",
  "loans.addLoan": "Add loan",
  "loans.iLent": "I lent",
  "loans.iBorrowed": "I borrowed",
  "loans.counterparty": "Who's this with",
  "loans.someoneNotOnTally": "Someone not on Tally",
  "loans.namePlaceholder": "e.g. Alex",
  "loans.principal": "Amount",
  "loans.schedule": "Payoff schedule",
  "loans.amount": "Amount",
  "loans.addInstallment": "+ Add installment",
  "loans.empty": "No loans yet.",
  "loans.youLent": "You lent",
  "loans.youBorrowed": "You borrowed",
  "loans.paidOff": "Paid off",
  "loans.deleteLoan": "Delete loan",
  "loans.noSchedule": "No payoff schedule set.",
  "settings.recurring": "Recurring transactions",
  "settings.budgets": "Budgets",
  "settings.savingsGoals": "Savings goals",
  "settings.autoImport": "Automatic import",
  "settings.dashboardWidgets": "Customize dashboard",
  "settings.calendar": "Calendar settings",
  "settings.currency": "Currency",
  "settings.language": "Language",
  "settings.usageGuide": "Usage guide",
  "settings.cardGuidelines": "Card guidelines",
  "settings.passGuidelines": "Pass guidelines",
  "settings.faqs": "FAQs",
  "settings.troubleshooting": "Troubleshooting",
  "settings.errorLog": "Error log",
  "settings.contact": "Contact",
  "settings.reportIssue": "Report an issue",
  "settings.changelog": "Changelog",
  "common.cancel": "Cancel",
  "common.dismiss": "Dismiss",
  "common.save": "Save",
  "common.saving": "Saving...",
  "common.delete": "Delete",
  "common.deleting": "Deleting...",
  "common.confirmDelete": "Confirm delete",
  "common.edit": "Edit",
  "common.more": "More",
  "common.close": "Close",
  "common.done": "Done",
  "common.status": "Status",
  "common.clear": "Clear",
  "common.apply": "Apply",
  "common.expense": "Expense",
  "common.income": "Income",
  "common.transfer": "Transfer",
  "common.date": "Date",
  "common.wallet": "Wallet",
  "common.notes": "Notes",
  "common.tags": "Tags",
  "common.category": "Category",
  "form.location": "Location",
  "form.locationPlaceholder": "Where was this? (optional)",
  "form.useCurrentLocation": "Use current location",
  "form.locationPinned": "Current location pinned",
  "form.locationRemovePin": "Remove pinned location",
  "form.locationDenied": "Location access was denied. Allow it in your browser settings to pin where you are.",
  "form.locationUnavailable": "Couldn't get your location right now.",
  "detail.location": "Location",
  "detail.pinnedLocation": "Pinned location",
  "detail.openInMaps": "Open in Maps",
  "detail.type": "Type",
  "detail.share": "Share",
  "common.or": "or",
  "form.moneyOut": "Money out",
  "form.moneyIn": "Money in",
  "form.transferNote": "Transfers aren't counted as income or spending, but still move your Remaining balance.",
  "form.amount": "Amount",
  "form.source": "Source",
  "form.description": "Description",
  "form.merchant": "Merchant",
  "form.duplicateWarningTitle": "Possible duplicate",
  "form.addReceiptPhoto": "Add receipt photo",
  "form.duplicateWarningBody": "You already have a similar transaction on record:",
  "form.saveDuplicateAnyway": "Save anyway",
  "form.merchantPlaceholderExpense": "e.g. Whole Foods",
  "form.merchantPlaceholderIncome": "e.g. Acme Corp",
  "form.merchantPlaceholderTransfer": "e.g. E-wallet top-up",
  "form.splitIntoCategories": "Split into multiple categories",
  "form.categoriesAndAmounts": "Categories & amounts",
  "form.addAnotherCategory": "+ Add another category",
  "form.tagsAndNotes": "Tags & notes",
  "form.notesPlaceholder": "Add a note...",
  "form.addTransaction": "Add transaction",
  "form.saveChanges": "Save changes",
  "modal.editTransaction": "Edit transaction",
  "modal.transactionDetails": "Transaction details",
  "modal.manual": "Manual",
  "modal.scan": "Scan",
  "modal.speak": "Speak",
  "modal.filters": "Filters",
  "modal.remainingBalance": "Remaining balance",
  "modal.setRemainingTo": "Set remaining balance to",
  "activities.yourBalance": "Your balance",
  "activities.allWallets": "All wallets",
  "activities.chooseWallet": "Choose wallet",
  "activities.searchPlaceholder": "Search merchant, notes, or tags...",
  "activities.mergeMerchantsPrompt": "These look like the same merchant, spelled differently. Merge them?",
  "activities.mergeMerchantsButton": "Merge",
  "activities.vendorFilterPrefix": "Vendor",
  "activities.tag": "Tag",
  "activities.dateRange": "Date range",
  "activities.allCategories": "All categories",
  "activities.allTags": "All tags",
  "activities.clearAllFilters": "Clear all filters",
  "activities.noTransactionsYet": "No transactions yet",
  "activities.noTransactionsDesc": "Add an expense or income entry, or scan a document, to get started.",
  "activities.noMatchingTransactions": "No matching transactions",
  "activities.noMatchingDesc": "Try a different search term or clear the filters.",
  "activities.export": "Export",
  "activities.select": "Select",
  "activities.addTagPlaceholder": "Add tag to selected...",
  "activities.addTag": "Add tag",
  "activities.viewReceipt": "View original receipt",
  "activities.noTransactionSelected": "No transaction selected",
  "activities.noTransactionSelectedDesc": "Pick one from the list to see its details here.",
  "activities.lastTransaction": "Last transaction",
  "activities.transaction": "transaction",
  "auth.welcomeBackTitle": "Welcome back to Tally",
  "auth.welcomeBackDesc": "Sign in to pick up right where you left off — your wallets, budgets, and activity are all waiting.",
  "auth.signIn": "Sign in",
  "auth.signingIn": "Signing in...",
  "auth.signUp": "Sign up",
  "auth.username": "Username",
  "auth.password": "Password",
  "auth.confirmPassword": "Confirm password",
  "auth.enterUsername": "Enter username",
  "auth.enterPassword": "Enter password",
  "auth.forgotPassword": "Forgot password?",
  "auth.continueWithGithub": "Continue with GitHub",
  "auth.dontHaveAccount": "Don't have an account?",
  "auth.alreadyHaveAccount": "Already have an account?",
  "auth.createAccount": "Create account",
  "auth.continueAsGuest": "Continue without an account",
  "auth.startingGuest": "Starting…",
  "guest.title": "You're using a guest account",
  "guest.desc": "Your data is saved on this device for 30 days. Create an account to keep it for good and use it on any device.",
  "guest.limits": "AI receipt scanning, voice entry, the assistant and API tokens need a full account.",
  "guest.keepData": "Keep your data",
  "guest.creating": "Creating…",
  "guest.signOut": "Sign out and delete guest data",
  "guest.signOutWarning": "Signing out of a guest account permanently deletes everything in it.",
  "guest.signOutConfirm": "Delete and sign out",
  "auth.creatingAccount": "Creating account...",
  "auth.getStarted": "Get started with Tally",
  "auth.completeSteps": "Complete these easy steps to start tracking your money.",
  "auth.stepCreateAccount": "Create your account",
  "auth.stepSetupWallet": "Set up a wallet",
  "auth.stepLogExpense": "Log your first expense",
  "auth.agreeToThe": "I agree to the",
  "auth.and": "and",
  "auth.termsAndConditions": "Terms & Conditions",
  "auth.privacyPolicy": "Privacy Policy",
  "auth.welcomeTagline": "A private, personal expense tracker — add expenses manually or snap a photo of a receipt and let it read the details for you.",
  "auth.usernameHint": "3-32 characters: letters, numbers, . _ -",
  "auth.passwordHint8": "At least 8 characters",
  "auth.reenterPassword": "Re-enter your password",
  "auth.somethingWentWrong": "Something went wrong.",
  "forgotPassword.title": "Reset your password",
  "forgotPassword.subtitle": "We'll email you a link to choose a new one",
  "forgotPassword.emailHint": "The email on file for your account, set in Settings > Account.",
  "forgotPassword.emailPlaceholder": "you@example.com",
  "forgotPassword.sendResetLink": "Send reset link",
  "forgotPassword.sending": "Sending...",
  "forgotPassword.sentPrefix": "If",
  "forgotPassword.sentSuffix": "has a Tally account, a password reset link is on its way.",
  "forgotPassword.checkInbox": "Check your inbox — the link expires in 1 hour.",
  "forgotPassword.backToSignIn": "Back to sign in",
  "resetPassword.title": "Choose a new password",
  "resetPassword.newPasswordLabel": "New password",
  "resetPassword.confirmNewPasswordLabel": "Confirm new password",
  "resetPassword.confirmPlaceholder": "Re-enter password",
  "resetPassword.resetButton": "Reset password",
  "resetPassword.tooShort": "Password must be at least 8 characters.",
  "resetPassword.noMatch": "Password and confirmation don't match.",
  "resetPassword.missingToken": "This reset link is missing its token.",
  "resetPassword.requestNewLink": "Request a new link",
  "offline.title": "You're offline",
  "offline.desc": "Tally needs a connection to load your data. Check your connection and try again.",
  "offline.tryAgain": "Try again",
  "welcome.greeting": "Hey, ",
  "welcome.welcomeBack": "Welcome back",
  "welcome.allAccountsBalance": "All Accounts • Total Balance",
  "common.add": "Add",
  "common.loading": "Loading…",
  "account.profile": "Profile",
  "account.email": "Email",
  "account.notSet": "Not set",
  "account.enterCurrentPasswordConfirm": "Enter your current password to confirm this change.",
  "account.addEmailHint": "Add an email so you can reset your password if you forget it.",
  "account.saveUsername": "Save username",
  "account.saveEmail": "Save email",
  "account.usernameUpdated": "Username updated.",
  "account.emailUpdated": "Email updated.",
  "account.connectedAccounts": "Connected accounts",
  "account.connected": "Connected",
  "account.notConnected": "Not connected",
  "account.unlink": "Unlink",
  "account.link": "Link",
  "account.setPasswordFirstHint": "Set a password first — otherwise unlinking would lock you out.",
  "account.setPasswordBeforeUnlink": "Set a password before unlinking, so you can still sign in afterward.",
  "account.githubLinked": "GitHub account linked.",
  "account.noPasswordGithub": "No password set — signed in with GitHub",
  "account.change": "Change",
  "account.setPassword": "Set password",
  "account.setPasswordHint": "Set a password so you can also sign in with a username and password, not just GitHub.",
  "account.currentPassword": "Current password",
  "account.newPassword": "New password",
  "account.confirmNewPassword": "Confirm new password",
  "account.savePassword": "Save password",
  "account.passwordUpdated": "Password updated.",
  "account.forgotItInstead": "Forgot it instead?",
  "account.resetLinkSent": "Reset link sent — check your inbox.",
  "account.emailMeResetLink": "Email me a reset link",
  "account.sending": "Sending...",
  "account.sessions": "Sessions",
  "account.signOut": "Sign out",
  "account.signOutAllDevices": "Sign out of all devices",
  "account.recentSecurityActivity": "Recent security activity",
  "account.noSecurityChanges": "No security-sensitive changes yet.",
  "account.dangerZone": "Danger zone",
  "account.deleteAccountWarning": "Permanently delete your account and all of its data. This can't be undone.",
  "account.deleteAccount": "Delete account",
  "account.unlinkGithubTitle": "Unlink GitHub?",
  "account.unlinkGithubDesc": "You'll need your username and password to sign in afterward instead.",
  "account.signOutTitle": "Sign out?",
  "account.signOutDesc": "You'll need to sign in again to view your expenses.",
  "account.signOutEverywhereTitle": "Sign out of all devices?",
  "account.signOutEverywhereDesc": "This signs out every device where you're currently logged in, including this one. You'll need to sign in again everywhere.",
  "account.signOutEverywhereButton": "Sign out everywhere",
  "account.signingOut": "Signing out...",
  "account.unlinking": "Unlinking...",
  "account.deleteAccountTitle": "Delete account",
  "account.deleteAccountDesc": "This permanently deletes your account, including every transaction, category, receipt image, and setting. There is no way to recover this data afterward.",
  "account.deleteAcknowledge": "I understand this action is permanent and all of my data will be lost.",
  "account.typeToConfirmPrefix": "Type",
  "account.typeToConfirmSuffix": "to confirm",
  "account.deleteMyAccount": "Delete my account",
  "account.security.usernameChanged": "Username changed",
  "account.security.passwordChanged": "Password changed",
  "account.security.passwordResetViaEmail": "Password reset via email link",
  "account.security.emailChanged": "Email changed",
  "account.security.emailRemoved": "Email removed",
  "account.security.signedOutEverywhere": "Signed out of all devices",
  "account.security.tokenRevoked": "Access token revoked",
  "account.security.signedIn": "Signed in",
  "account.security.accountCreatedGithub": "Account created via GitHub",
  "account.security.githubLinked": "GitHub account linked",
  "account.security.githubUnlinked": "GitHub account unlinked",
  "account.security.tokenCreated": "Access token created",
  "permissions.deviceAccess": "Device access",
  "permissions.deviceAccessDesc": "What Tally can access on this device, for receipt scanning and voice entry.",
  "permissions.microphone": "Microphone",
  "permissions.microphoneDesc": "Needed for voice entry.",
  "permissions.camera": "Camera",
  "permissions.cameraDesc": "Needed to take a photo of a receipt.",
  "permissions.photos": "Photos",
  "permissions.photosDesc": "Needed to attach a receipt image from your gallery.",
  "permissions.granted": "Granted",
  "permissions.requestAccess": "Request access",
  "permissions.blockedRetry": "Blocked — retry",
  "permissions.notifications": "Notifications",
  "currency.defaultCurrency": "Default currency",
  "currency.defaultCurrencyDesc": "Used for new transactions and everywhere amounts are shown, unless a wallet has its own currency label.",
  "currency.conversion": "Conversion",
  "currency.conversionDescPrefix": "Uses live exchange rates from",
  "currency.conversionDescSuffix": ", a free ECB-rate API.",
  "currency.autoConvert": "Auto-convert",
  "currency.autoConvertDescPrefix": "Convert detected foreign currencies to",
  "currency.autoConvertDescSuffix": "when scanning or recording.",
  "currency.convertBalances": "Convert wallet balances",
  "currency.convertBalancesDescPrefix": "Convert wallets in a different currency to",
  "currency.convertBalancesDescSuffix": "for the Dashboard's Net worth total.",
  "calendar.weekStartsOn": "Week starts on",
  "activities.settingsDesc": "Defaults for how the Activities list looks and starts up — none of these lock the page's own filter/sort controls, they just decide what it opens to.",
  "activities.hideMerchantIcons": "Hide merchant icons",
  "activities.hideMerchantIconsDesc": "Hides the round category-icon badge next to each row in the list.",
  "activities.defaultTypeFilter": "Default type filter",
  "activities.defaultTypeFilterDesc": "Which tab Activities opens to — \"All\" (default) shows every transaction.",
  "activities.typeAll": "All",
  "activities.defaultSort": "Default sort order",
  "activities.defaultSortDesc": "How transactions are ordered when the list first loads.",
  "activities.sortNewest": "Newest first",
  "activities.sortOldest": "Oldest first",
  "activities.sortAmountDesc": "Amount: high to low",
  "activities.sortAmountAsc": "Amount: low to high",
  "activities.defaultDateRange": "Default date range",
  "activities.defaultDateRangeDesc": "Starting date filter for the list — \"None\" (default) shows everything.",
  "activities.dateRangeNone": "None (show everything)",
  "activities.dateRangeLast7": "Last 7 days",
  "activities.dateRangeLast30": "Last 30 days",
  "activities.dateRangeLast90": "Last 90 days",
  "activities.dateRangeThisMonth": "This month",
  "activities.groupByMonth": "Group by month",
  "activities.groupByMonthDesc": "Shows a month header and net total above each group. Turn off for one flat list.",
  "activities.groupBy": "Group by",
  "activities.groupByDesc": "Shows a header and net total above each group. Pick None for one flat list.",
  "activities.groupByOptionNone": "None",
  "activities.groupByOptionDay": "Day",
  "activities.groupByOptionWeek": "Week",
  "activities.groupByOptionMonth": "Month",
  "analytics.title": "Analytics",
  "analytics.customize": "Customize",
  "analytics.showSections": "Show sections",
  "analytics.sectionOverview": "Overview",
  "analytics.sectionTrend": "Spending trend",
  "analytics.sectionCategories": "Categories",
  "analytics.sectionNetWorth": "Net worth & wallets",
  "analytics.sectionBudgets": "Budgets & goals",
  "analytics.sectionForward": "Forward-looking",
  "analytics.sectionSavings": "Savings rate",
  "analytics.savingsDesc": "How much of your income you kept this period",
  "analytics.savingsOfIncome": "of income saved",
  "analytics.pointsVsPrevious": "pts vs previous period",
  "analytics.noIncomeThisPeriod": "No income logged this period.",
  "analytics.sectionMovers": "Category movers",
  "analytics.moversDesc": "Categories that changed the most vs the previous period",
  "analytics.sectionWeekday": "Spending by day",
  "analytics.weekdayDesc": "Which day of the week you spend the most on",
  "analytics.weekdayDescWithTop": "You spend the most on {day}s",
  "analytics.sectionBiggest": "Biggest transactions",
  "analytics.biggestDesc": "Your largest single expenses this period",
  "analytics.sectionMerchants": "Top merchants",
  "analytics.merchantsDesc": "Who you've spent the most with this period",
  "analytics.manageVendors": "Manage vendors",
  "analytics.noMerchantsYet": "No expenses logged for this period yet.",
  "analytics.merchantVisits": "{count}x",
  "analytics.periodThisMonth": "This month",
  "analytics.periodLastMonth": "Last month",
  "analytics.periodLast3Months": "Last 3 months",
  "analytics.periodLast6Months": "Last 6 months",
  "analytics.periodYearToDate": "Year to date",
  "analytics.netWorth": "Net worth",
  "analytics.net": "Net",
  "analytics.vsLastPeriod": "vs last period",
  "analytics.editNetWorth": "Edit net worth",
  "analytics.trendDesc": "Income and expenses over the selected period.",
  "analytics.netWorthWalletsDesc": "How your total balance has moved, and which wallets make it up.",
  "analytics.walletsByBalance": "Wallets by balance",
  "analytics.budgetsGoalsDesc": "This month's budgets and your savings goals, at a glance.",
  "analytics.manage": "Manage",
  "analytics.forwardDesc": "Where this month is headed, and what's coming up.",
  "analytics.manageRecurring": "Manage recurring",
  "analytics.projectedSpend": "Projected month-end spend",
  "analytics.spentSoFar": "{amount} spent so far ({elapsed} of {total} days)",
  "analytics.pace": "{pct}% pace",
  "analytics.upcomingRecurring": "Upcoming recurring",
  "analytics.noRecurringScheduled": "Nothing scheduled — add a recurring rule in Settings.",
  "analytics.dueToday": "Due today",
  "analytics.dueTomorrow": "Due tomorrow",
  "analytics.dueInDays": "In {days} days",
  "activities.collapseSplitGroups": "Collapse split groups by default",
  "activities.collapseSplitGroupsDesc": "A split expense's per-category breakdown starts hidden until you tap it, instead of always expanded.",
  "activities.compactRows": "Compact rows",
  "activities.compactRowsDesc": "Tighter padding and a smaller icon on every row, so more transactions fit on screen.",
  "activities.hideTagsInRow": "Hide tag chips in list",
  "activities.hideTagsInRowDesc": "Hides the #tag chips under each row — tags still show in the transaction detail view.",
  "calendar.weekStartsOnDesc": "Controls the first day shown in date pickers.",
  "calendar.monthStartsOn": "Month starts on date",
  "calendar.monthStartsOnDesc": "Day of the month your budgeting period begins, for custom pay cycles.",
  "calendar.biweeklyAnchor": "Bi-weekly period anchor",
  "calendar.biweeklyAnchorDesc": "Pick any date that starts one of your pay periods; every 14 days from it marks the next.",
  "calendar.defaultView": "Default view when app launches",
  "calendar.timezone": "Time zone",
  "calendar.showWeekNumbers": "Show week numbers",
  "calendar.showWeekNumbersDesc": "Adds a week-number column to date pickers.",
  "calendar.alternateCalendar": "Alternate calendar",
  "calendar.alternateCalendarDesc": "Show an additional calendar system alongside Gregorian dates.",
  "calendar.weekday.sunday": "Sunday",
  "calendar.weekday.monday": "Monday",
  "calendar.weekday.tuesday": "Tuesday",
  "calendar.weekday.wednesday": "Wednesday",
  "calendar.weekday.thursday": "Thursday",
  "calendar.weekday.friday": "Friday",
  "calendar.weekday.saturday": "Saturday",
  "datePicker.selectDate": "Select date",
  "datePicker.today": "Today",
  "calendar.prevMonth": "Previous month",
  "calendar.nextMonth": "Next month",
  "calendar.weekAbbrev": "Wk",
  "dateRange.allDates": "All dates",
  "dateRange.from": "From",
  "dateRange.until": "Until",
  "dateRange.startDate": "Start date",
  "dateRange.endDate": "End date",
  "dateRange.filterByDateRange": "Filter by date range",
  "calendar.view.today": "Today",
  "calendar.view.thisWeek": "This week",
  "calendar.view.thisMonth": "This month",
  "calendar.view.allTime": "All time",
  "calendar.tz.auto": "Auto (device)",
  "calendar.altcal.none": "None (Gregorian only)",
  "calendar.altcal.lunar": "Lunar",
  "calendar.altcal.buddhist": "Buddhist",
  "wallet.wallets": "Wallets",
  "wallet.walletsDesc": "Each transaction can be assigned to a wallet; the default is used when none is chosen. Archiving hides a wallet from pickers and totals without deleting its history.",
  "wallet.addWallet": "Add wallet",
  "wallet.default": "Default",
  "wallet.digital": "Digital",
  "wallet.cash": "Cash",
  "wallet.makeDefault": "Make default",
  "wallet.sharedWithYou": "Shared",
  "wallet.shareWallet": "Share wallet",
  "wallet.shareWalletDesc": "Invite a friend to view and add transactions to this wallet.",
  "wallet.pickFriendToInvite": "Pick a friend to invite",
  "wallet.invite": "Invite",
  "wallet.memberAccepted": "Accepted",
  "wallet.memberDeclined": "Declined",
  "wallet.memberPending": "Pending",
  "wallet.removeMember": "Remove",
  "wallet.leaveShared": "Leave shared wallet",
  "wallet.invitedBy": "Invited by",
  "wallet.accept": "Accept",
  "wallet.defaultForActivities": "Default wallet for Activities",
  "wallet.defaultForActivitiesDesc": "Which wallet the Activities page's balance card is scoped to when it opens.",
  "wallet.archived": "Archived",
  "wallet.archive": "Archive",
  "settings.keyboardShortcuts": "Keyboard shortcuts",
  "settings.design": "Design",
  "design.intro": "Choose how Tally looks. Your data and features are the same in both — this only changes the visual style on this device.",
  "design.modern": "Modern",
  "design.modernDesc": "Clean, flat and minimal. The new default.",
  "design.classic": "Classic",
  "design.classicDesc": "The original green liquid-glass look.",
  "keyboardShortcuts.title": "Keyboard shortcuts",
  "keyboardShortcuts.groupGeneral": "General",
  "keyboardShortcuts.groupNavigation": "Navigation",
  "keyboardShortcuts.commandPalette": "Open command palette",
  "keyboardShortcuts.addTransaction": "Add a transaction",
  "keyboardShortcuts.showShortcuts": "Show this list",
  "keyboardShortcuts.goActivities": "Go to Activities",
  "keyboardShortcuts.goAnalytics": "Go to Analytics",
  "keyboardShortcuts.goWallet": "Go to Wallet",
  "keyboardShortcuts.goSettings": "Go to Settings",
  "keyboardShortcuts.then": "then",
  "keyboardShortcuts.desktopOnly": "Shortcuts are available on desktop only.",
  "commandPalette.placeholder": "Type a command or search...",
  "commandPalette.noResults": "No matching commands",
  "notification.title": "Notifications",
  "notification.markAllRead": "Mark all read",
  "notification.empty": "No notifications yet",
  "notification.emptyDesc": "Recurring transactions, budget alerts, and loan reminders will show up here.",
  "folder.newFolder": "New folder",
  "folder.editTitle": "Edit folder",
  "folder.nameLabel": "Name",
  "folder.colorLabel": "Color",
  "folder.couldNotSave": "Could not save.",
  "folder.couldNotDelete": "Could not delete that folder.",
  "folder.moveToNamed": "Move to {name}",
  "folder.removeFromFolder": "Remove from folder",
  "folder.passCountOne": "1 pass",
  "folder.passCountOther": "{count} passes",
  "folder.rename": "Rename folder",
  "folder.delete": "Delete folder",
  "folder.deleteConfirm": "Delete this folder? Its contents stay — they'll just be ungrouped.",
  "wallet.addMoney": "Add Money",
  "wallet.confirmArchiveTitle": "Archive this wallet?",
  "wallet.confirmArchiveDesc": "You can restore it any time from Manage accounts.",
  "tag.couldNotLoad": "Could not load tags.",
  "tag.loading": "Loading tags…",
  "tag.noTagsYet": "No tags yet — add tags to a transaction (in Manual entry, or when reviewing a scan/recording) and they'll show up here.",
  "tag.transaction": "transaction",
  "vendors.sortLabel": "Sort by",
  "vendors.sortMostUsed": "Most used",
  "vendors.sortAlphabetical": "Alphabetical",
  "vendors.sortRecent": "Recently used",
  "vendors.sortHighestSpend": "Highest spend",
  "vendors.totalSpent": "Total spent",
  "vendors.lastUsed": "Last used",
  "vendors.noVendorsYet": "No vendors yet — they'll show up here once you log a transaction.",
  "vendors.selectedCount": "selected",
  "vendors.mergeInto": "Merge into",
  "vendors.couldNotRename": "Could not rename that vendor.",
  "vendors.couldNotMergeSome": "Some vendors couldn't be merged.",
  "tag.confirm": "Confirm",
  "category.colorsIconsDesc": "Colors and icons used across the app.",
  "category.addCategory": "Add category",
  "category.noCategoriesPrefix": "No",
  "category.noCategoriesSuffix": "categories yet.",
  "recurring.title": "Recurring transactions",
  "recurring.addRule": "Add rule",
  "recurring.desc": "Rent, subscriptions, salary — logged automatically on the schedule you set, next time you open Tally on or after the due date.",
  "recurring.editingRulePrefix": "Editing",
  "recurring.editingRuleSuffix": "rule — type can't be changed; delete and re-add to change it.",
  "recurring.frequency": "Frequency",
  "recurring.startsOn": "Starts on",
  "recurring.saveRule": "Save rule",
  "recurring.noRulesYet": "No recurring transactions yet — add one above to have it logged automatically.",
  "recurring.weekly": "Weekly",
  "recurring.monthly": "Monthly",
  "recurring.yearly": "Yearly",
  "recurring.next": "next",
  "budget.title": "Budgets",
  "budget.setABudget": "Set a budget",
  "budget.desc": "Set a monthly spending limit per category. Add the \"Budgets\" widget to your dashboard to see progress at a glance.",
  "budget.monthlyLimit": "Monthly limit",
  "budget.rolloverToggle": "Roll over unused budget into next month",
  "budget.saveBudget": "Save budget",
  "budget.noBudgetsYet": "No budgets set yet — add one above to track spending per category.",
  "budget.rollover": "Rollover",
  "budget.perMonth": "/ month",
  "savings.title": "Savings goals",
  "savings.desc": "Track progress toward something you're saving for. Add contributions manually as you set money aside.",
  "savings.name": "Name",
  "savings.namePlaceholder": "e.g. New laptop",
  "savings.targetAmount": "Target amount",
  "savings.color": "Color",
  "savings.saveGoal": "Save goal",
  "savings.noGoalsYet": "No savings goals yet — add one to start tracking your progress.",
  "savings.withdraw": "Withdraw",
  "savings.noContributionsYet": "No contributions yet.",
  "friends.couldNotLoad": "Could not load friends.",
  "friends.searchPlaceholder": "Search by username or email",
  "friends.searching": "Searching…",
  "friends.noOneFound": "No one found.",
  "friends.friendsStatus": "Friends",
  "friends.requestSent": "Request sent",
  "friends.respondInRequests": "Respond in Requests",
  "friends.friendsTab": "Friends",
  "friends.familyTab": "Family",
  "friends.requestsTab": "Requests",
  "friends.noFriendsYet": "No friends yet — search above to find people already using Tally.",
  "friends.addToFamily": "Add to Family",
  "friends.noFamilyYet": "No one in your Family list yet — add a friend from the Friends tab to include them here.",
  "friends.noPendingRequests": "No pending requests — search above to add someone.",
  "friends.received": "Received",
  "friends.sent": "Sent",
  "friends.accept": "Accept",
  "friends.decline": "Decline",
  "challenges.newChallenge": "New challenge",
  "challenges.challengeName": "Challenge name",
  "challenges.targetDays": "Target days",
  "challenges.categoryOptional": "Category (optional)",
  "challenges.invite": "Invite",
  "challenges.creating": "Creating…",
  "challenges.createChallenge": "Create challenge",
  "challenges.noChallengesYet": "No challenges yet — create one and invite friends or family.",
  "challenges.people": "people",
  "challenges.combinedProgress": "Combined progress",
  "challenges.you": "(you)",
  "challenges.addContribution": "Add contribution",
  "challenges.removing": "Removing…",
  "challenges.confirmDelete": "Confirm delete",
  "challenges.confirmLeave": "Confirm leave",
  "challenges.noPendingInvites": "No pending invites or reveal requests.",
  "challenges.challengeInvites": "Challenge invites",
  "challenges.wantsToSeeAmount": "Wants to see your amount",
  "challenges.day": "day",
  "challenges.savingsRace": "Savings race",
  "challenges.spendingLimit": "Spending limit",
  "challenges.noSpendDays": "No-spend days",
  "challenges.together": "Together",
  "challenges.againstEachOther": "Against each other",
  "split.equalSplit": "Equal split",
  "split.customSplit": "Custom split",
  "split.iPaidWhole": "I paid the whole bill",
  "split.trackWhoPaid": "Track who paid what",
  "split.settledUp": "Settled up",
  "split.youreOwedPrefix": "You're owed",
  "split.youOwePrefix": "You owe",
  "split.requireConfirmation": "Require confirmation",
  "split.requireConfirmationDesc": "Splits you create need the other person to accept before they count.",
  "split.splitsTab": "Splits",
  "split.newSplit": "New split",
  "split.whatsTheBillFor": "What's the bill for?",
  "split.totalAmount": "Total amount",
  "split.splitWith": "Split with",
  "split.whoOwesWhat": "Who owes what",
  "split.whoPaidWhat": "Who paid what",
  "split.allocated": "allocated",
  "split.you": "You",
  "split.createSplit": "Create split",
  "split.noSplitsYet": "No split bills yet — create one and split it with friends.",
  "split.pending": "Pending",
  "split.declined": "Declined",
  "split.owesPrefix": "owes",
  "split.paidPrefix": "paid",
  "split.markSettled": "Mark settled",
  "split.copyShareLink": "Copy share link",
  "split.linkCopied": "Link copied",
  "split.noPendingRequests": "No pending split requests.",
  "split.total": "total",
  "tokens.title": "Access tokens",
  "tokens.newToken": "New token",
  "tokens.desc": "A token lets an automation (like an iOS Shortcut) add transactions to your account without signing in. Anyone with a token can add transactions on your behalf — treat it like a password.",
  "tokens.copyNowWarning": "Copy this token now — you won't be able to see it again.",
  "tokens.copied": "Copied!",
  "tokens.copy": "Copy",
  "tokens.nameLabel": "Name (so you remember what it's for)",
  "tokens.namePlaceholder": "e.g. iPhone Shortcut",
  "tokens.createToken": "Create token",
  "tokens.noTokensYet": "No tokens yet — create one to let an automation add transactions for you.",
  "tokens.lastUsedPrefix": "Last used",
  "tokens.neverUsed": "Never used",
  "tokens.revoking": "Revoking...",
  "tokens.confirmRevoke": "Confirm revoke",
  "errors.clearAll": "Clear all",
  "errors.descPart1": "A local record of error messages Tally has shown you recently — nothing here leaves your device unless you tap Report on an entry, which opens a pre-filled GitHub issue. See also",
  "errors.descPart2": "for common causes and fixes, or",
  "errors.descPart3": "if what you're reporting isn't a specific error shown here (a feature request, or something that didn't surface an error message at all).",
  "errors.noErrorsYet": "No errors logged yet.",
  "errors.dismiss": "Dismiss",
  "errors.reportThisError": "Report this error",
  "notifications.emailTitle": "Email notifications",
  "notifications.addEmailFirst": "Add an email in Account first to enable email notifications.",
  "notifications.noBackgroundWorker": "There's no background worker in this app — notifications send the next time you open Tally after the triggering event, not the instant it happens.",
  "notifications.recurringLoggedTitle": "Recurring transactions logged",
  "notifications.recurringLoggedDesc": "Email me a summary whenever a recurring rule auto-logs a transaction.",
  "notifications.overBudgetTitle": "Over budget",
  "notifications.overBudgetDesc": "Email me once per month the first time a category goes over its budget.",
  "widget.summaryTitle": "Summary cards",
  "widget.summaryDesc": "This month's income, expenses, and your remaining balance",
  "widget.categoryOverviewTitle": "Category breakdown",
  "widget.categoryOverviewDesc": "Spending trend chart and category totals",
  "widget.walletsTitle": "Wallets",
  "widget.walletsDesc": "Each wallet's balance at a glance",
  "widget.recentTransactionsTitle": "Recent transactions",
  "widget.recentTransactionsDesc": "Your latest transactions, as a timeline",
  "widget.incomeCardTitle": "Income card",
  "widget.incomeCardDesc": "This month's income — tap to add income",
  "widget.expensesCardTitle": "Expenses card",
  "widget.expensesCardDesc": "This month's expenses — tap to add an expense",
  "widget.remainingCardTitle": "Remaining card",
  "widget.remainingCardDesc": "Your remaining balance — tap to edit it",
  "widget.todaySpendingTitle": "Today's spending",
  "widget.todaySpendingDesc": "Total spent so far today",
  "widget.yesterdaySpendingTitle": "Yesterday's spending",
  "widget.yesterdaySpendingDesc": "Total spent yesterday",
  "widget.weekSpendingTitle": "This week's spending",
  "widget.weekSpendingDesc": "Total spent since the start of the week",
  "widget.monthSpendingTitle": "This month's spending",
  "widget.monthSpendingDesc": "Total spent so far this month",
  "widget.yearSpendingTitle": "This year's spending",
  "widget.yearSpendingDesc": "Total spent so far this year",
  "widget.todayIncomeTitle": "Today's income",
  "widget.todayIncomeDesc": "Total received so far today",
  "widget.monthIncomeTitle": "This month's income",
  "widget.monthIncomeDesc": "Total received so far this month",
  "widget.yearIncomeTitle": "This year's income",
  "widget.yearIncomeDesc": "Total received so far this year",
  "widget.netWorthTitle": "Net worth",
  "widget.netWorthDesc": "Combined balance across every wallet",
  "widget.totalBalanceTitle": "Total balance",
  "widget.totalBalanceDesc": "Sum of every active wallet's balance",
  "widget.avgDailySpendingTitle": "Average daily spending",
  "widget.avgDailySpendingDesc": "This month's spending divided by days elapsed",
  "widget.avgTransactionAmountTitle": "Average transaction",
  "widget.avgTransactionAmountDesc": "Average expense amount this month",
  "widget.avgIncomeAmountTitle": "Average income",
  "widget.avgIncomeAmountDesc": "Average income amount this month",
  "widget.biggestExpenseTitle": "Biggest expense",
  "widget.biggestExpenseDesc": "Your largest single expense this month",
  "widget.biggestIncomeTitle": "Biggest income",
  "widget.biggestIncomeDesc": "Your largest single income this month",
  "widget.transactionCountTitle": "Transaction count",
  "widget.transactionCountDesc": "Number of transactions logged this month",
  "widget.transfersTotalTitle": "Transfers total",
  "widget.transfersTotalDesc": "Total moved via transfers this month",
  "widget.walletCountTitle": "Wallet count",
  "widget.walletCountDesc": "Number of active wallets",
  "widget.categoryCountTitle": "Categories used",
  "widget.categoryCountDesc": "Distinct categories used this month",
  "widget.tagCountTitle": "Tags used",
  "widget.tagCountDesc": "Distinct tags used this month",
  "widget.monthComparisonTitle": "Month vs last month",
  "widget.monthComparisonDesc": "How this month's spending compares to last month's",
  "widget.incomeComparisonTitle": "Income vs last month",
  "widget.incomeComparisonDesc": "How this month's income compares to last month's",
  "widget.weekComparisonTitle": "Week vs last week",
  "widget.weekComparisonDesc": "How this week's spending compares to last week's",
  "widget.yearOverYearTitle": "Year over year",
  "widget.yearOverYearDesc": "How this year's spending compares to last year's",
  "widget.savingsRateTitle": "Savings rate",
  "widget.savingsRateDesc": "Share of this month's income you kept",
  "widget.monthProgressTitle": "Month progress",
  "widget.monthProgressDesc": "How far through the current month you are",
  "widget.yearProgressTitle": "Year progress",
  "widget.yearProgressDesc": "How far through the current year you are",
  "widget.spendPaceTitle": "Spending pace",
  "widget.spendPaceDesc": "This month's spend vs. an even day-by-day pace",
  "widget.walletUsageTitle": "Wallet usage",
  "widget.walletUsageDesc": "Your default wallet's share of your total balance",
  "widget.last14DaysSparkTitle": "14-day spending trend",
  "widget.last14DaysSparkDesc": "A quick line of the last two weeks' spending",
  "widget.last14DaysIncomeSparkTitle": "14-day income trend",
  "widget.last14DaysIncomeSparkDesc": "A quick line of the last two weeks' income",
  "widget.last6MonthsSparkTitle": "6-month spending trend",
  "widget.last6MonthsSparkDesc": "A quick line of the last six months' spending",
  "widget.categoryDonutTitle": "Category split",
  "widget.categoryDonutDesc": "This month's spending by category, as a donut",
  "widget.typeDonutTitle": "Transaction mix",
  "widget.typeDonutDesc": "Share of expense/income/transfer transactions this month",
  "widget.walletDonutTitle": "Balance split",
  "widget.walletDonutDesc": "Share of your total balance held in each wallet",
  "widget.last30DaysHeatmapTitle": "30-day activity",
  "widget.last30DaysHeatmapDesc": "A calendar heatmap of the last 30 days' spending",
  "widget.last90DaysHeatmapTitle": "90-day activity",
  "widget.last90DaysHeatmapDesc": "A calendar heatmap of the last 90 days' spending",
  "widget.walletShareBarTitle": "Wallet share bar",
  "widget.walletShareBarDesc": "Every wallet's share of your total balance, as one bar",
  "widget.categoryShareBarTitle": "Category share bar",
  "widget.categoryShareBarDesc": "This month's top categories, as one segmented bar",
  "widget.incomeVsExpenseBarsTitle": "Income vs expenses",
  "widget.incomeVsExpenseBarsDesc": "This month's income and spending side by side",
  "widget.cashVsDigitalBarsTitle": "Cash vs digital",
  "widget.cashVsDigitalBarsDesc": "Balance held in cash wallets vs digital wallets",
  "widget.topCategoriesTitle": "Top categories",
  "widget.topCategoriesDesc": "Your top spending categories this month",
  "widget.topMerchantsTitle": "Top merchants",
  "widget.topMerchantsDesc": "Merchants you've spent the most with this month",
  "widget.topTagsTitle": "Top tags",
  "widget.topTagsDesc": "Your most-used tags",
  "widget.topIncomeSourcesTitle": "Top income sources",
  "widget.topIncomeSourcesDesc": "Your highest-earning income categories this month",
  "widget.walletDistributionTitle": "Wallet distribution",
  "widget.walletDistributionDesc": "Balance breakdown across your wallets",
  "widget.expensesByWalletTitle": "Spending by wallet",
  "widget.expensesByWalletDesc": "This month's spending broken down by wallet",
  "widget.topMerchantsLeaderboardTitle": "Merchant leaderboard",
  "widget.topMerchantsLeaderboardDesc": "Your top merchants this month, ranked",
  "widget.topCategoriesLeaderboardTitle": "Category leaderboard",
  "widget.topCategoriesLeaderboardDesc": "Your top categories this month, ranked",
  "widget.last7DaysTitle": "Last 7 days",
  "widget.last7DaysDesc": "Daily spending for the past week, as bars",
  "widget.netWorthTickerTitle": "Net worth ticker",
  "widget.netWorthTickerDesc": "Your combined balance as a stock-style ticker card",
  "widget.walletTickerTitle": "Wallet ticker",
  "widget.walletTickerDesc": "Your default wallet's balance as a stock-style ticker card",
  "widget.todayPillTitle": "Today pill",
  "widget.todayPillDesc": "Today's spending, as a compact pill",
  "widget.pacePillTitle": "Spending pace pill",
  "widget.pacePillDesc": "This month's spend pace vs. last month, with a progress ring",
  "widget.noSpendDaysTitle": "No-spend streak",
  "widget.noSpendDaysDesc": "Which days this week you didn't spend anything",
  "widget.balanceHeroTitle": "Balance hero",
  "widget.balanceHeroDesc": "A big balance card with your wallets and quick add buttons",
  "widget.payPeriodStepperTitle": "Month progress stepper",
  "widget.payPeriodStepperDesc": "Where you are in the current month, as a stepper",
  "widget.spendingStreakTitle": "Under-budget streak",
  "widget.spendingStreakDesc": "Days this week you spent less than your daily average",
  "widget.budgetOverviewTitle": "Budgets",
  "widget.budgetOverviewDesc": "This month's spending against each category's budget",
  "widget.savingsGoalsWidgetTitle": "Savings goals",
  "widget.savingsGoalsWidgetDesc": "Progress toward each of your savings goals",
  "widget.welcomeTitle": "Welcome card",
  "widget.welcomeDesc": "Your profile picture, greeting, total balance, and quick add buttons",
  "dashboardWidgetContent.there": "there",
  "dashboardWidgetContent.allAccountsTotalBalance": "All Accounts • Total Balance",
  "dashboardWidgetContent.allWalletsCombined": "All wallets combined",
  "dashboardWidgetContent.across": "Across",
  "dashboardWidgetContent.activeWallet": "active wallet",
  "dashboardWidgetContent.activeWallets": "active wallets",
  "dashboardWidgetContent.activeWalletsLabel": "Active wallets",
  "dashboardWidgetContent.thisMonth": "This month",
  "dashboardWidgetContent.noExpensesThisMonth": "No expenses this month",
  "dashboardWidgetContent.noIncomeThisMonth": "No income this month",
  "dashboardWidgetContent.vs": "vs",
  "dashboardWidgetContent.lastMonth": "last month",
  "dashboardWidgetContent.lastWeek": "last week",
  "dashboardWidgetContent.lastYear": "last year",
  "dashboardWidgetContent.day": "Day",
  "dashboardWidgetContent.of": "of",
  "dashboardWidgetContent.aheadOfPace": "Ahead of last month's pace",
  "dashboardWidgetContent.behindPace": "Behind last month's pace",
  "dashboardWidgetContent.onPace": "On pace",
  "dashboardWidgetContent.noWalletsYet": "No wallets yet",
  "dashboardWidgetContent.share": "share",
  "dashboardWidgetContent.expenseType": "Expense",
  "dashboardWidgetContent.incomeType": "Income",
  "dashboardWidgetContent.transferType": "Transfer",
  "dashboardWidgetContent.walletShareTitle": "Wallet share",
  "dashboardWidgetContent.categoryShareTitle": "Category share",
  "dashboardWidgetContent.cash": "Cash",
  "dashboardWidgetContent.digital": "Digital",
  "dashboardWidgetContent.unassigned": "Unassigned",
  "dashboardWidgetContent.aheadLastMonth": "Ahead of last month",
  "dashboardWidgetContent.behindLastMonth": "Behind last month",
  "dashboardWidgetContent.noSpendDaysThisWeek": "No-spend days this week",
  "dashboardWidgetContent.stageStart": "Start",
  "dashboardWidgetContent.stageMidMonth": "Mid-month",
  "dashboardWidgetContent.stageEnd": "End",
  "dashboardWidgetContent.underAverageSpendingThisWeek": "Under-average spending this week",
  "summaryCard.income": "Income",
  "summaryCard.expenses": "Expenses",
  "summaryCard.remaining": "Remaining",
  "widgetCategory.overview": "Overview",
  "widgetCategory.chart": "Charts",
  "widgetCategory.budget": "Budget",
  "widgetCategory.goals": "Goals",
  "widgetWidth.small": "Small",
  "widgetWidth.medium": "Medium",
  "widgetWidth.large": "Large",
  "dashboardWidgets.addWidgetAria": "Add widget",
  "dashboardWidgets.doneAria": "Done",
  "dashboardWidgets.intro": "This is your Dashboard — drag a tile to reorder it, tap the size badge to resize, or the gear to configure it. Tap the paintbrush to add more widgets.",
  "dashboardWidgets.emptyState": "Your dashboard is empty. Tap the paintbrush above to add a widget.",
  "dashboardWidgets.show": "Show",
  "dashboardWidgets.color": "Color",
  "dashboardWidgets.wallet": "Wallet",
  "dashboardWidgets.allWallets": "All wallets",
  "dashboardWidgets.quickActionButton": "Quick action button",
  "dashboardWidgets.addAWidgetTitle": "Add a widget",
  "dashboardWidgets.categoriesBack": "Categories",
  "dashboardWidgets.widgetSingular": "widget",
  "dashboardWidgets.widgetPlural": "widgets",
  "dashboardWidgets.reorderPrefix": "Reorder",
  "dashboardWidgets.removePrefix": "Remove",
  "dashboardWidgets.configurePrefix": "Configure",
  "dashboardWidgets.sizePrefix": "Size",
  "wallet.editTitle": "Edit wallet",
  "wallet.appDefault": "App default",
  "wallet.nameLabel": "Name",
  "wallet.namePlaceholder": "e.g. Cash, Bank, E-wallet",
  "wallet.typeLabel": "Account type",
  "wallet.colorLabel": "Color",
  "wallet.currencyLabel": "Currency",
  "wallet.currencyNote": "A display label only — amounts aren't converted between currencies.",
  "wallet.balanceLabel": "Balance",
  "wallet.balanceNote": "Sets this wallet's current balance directly — only transactions logged after this point will move it.",
  "wallet.latestTransactions": "Latest Transactions",
  "wallet.noTransactionsYet": "No transactions yet",
  "wallet.defaultWalletLabel": "Default wallet",
  "wallet.defaultWalletDesc": "Used for new transactions unless you pick another.",
  "wallet.showBalanceOnCardLabel": "Show balance on card",
  "wallet.showBalanceOnCardDesc": "Preview the balance amount on the card face.",
  "wallet.showCurrencyOnCardLabel": "Show currency on card",
  "wallet.showCurrencyOnCardDesc": "Format the balance preview with its currency, not just a bare number.",
  "wallet.showCardNumberLabel": "Show card number",
  "wallet.showCardNumberDesc": "Show the masked •••• •••• •••• 1234 row on the card face.",
  "wallet.showNameOnCardLabel": "Show name on card",
  "wallet.showNameOnCardDesc": "Show the wallet's name on the card face.",
  "wallet.uploadTemplateLabel": "Upload as template",
  "wallet.uploadTemplateDesc": "Submit this card's look for review — if approved, it'll appear in Premade Cards for everyone to use.",
  "wallet.uploadTemplateVariationDesc": "Submit this recolored version as a new template — the same name, category, and forced settings, with your new colors.",
  "wallet.viewCardGuidelinesLink": "View card design guidelines",
  "cardGuidelines.title": "Card design guidelines",
  "cardGuidelines.intro": "Reference specs for anyone designing a wallet card look to submit as a Premade Card template — the exact shape, proportions, and layout zones every card in the app renders with.",
  "cardGuidelines.ratioLabel": "aspect ratio",
  "cardGuidelines.physicalSizeLabel": "physical card size",
  "cardGuidelines.minHeightLabel": "minimum render height",
  "cardGuidelines.ratioHeading": "Shape & ratio",
  "cardGuidelines.ratioBody": "Every wallet card renders at the ISO/IEC 7810 ID-1 ratio — the same proportions as a real debit or credit card — regardless of how wide its container is. Design at any resolution that keeps this exact ratio; roughly 1024×646px or larger keeps patterns crisp on high-density screens.\nCorners are rounded 16px, and the card never shrinks below 190px tall even in a narrow layout.",
  "cardGuidelines.layoutHeading": "Layout & safe zones",
  "cardGuidelines.layoutBody": "The network badge and chip can each be pinned to a corner (or the chip centered against the left edge) — leave roughly 64px clear in that corner for the badge and 40px for the chip so your artwork doesn't collide with them.\nThe card number, holder name, and wallet label rows can also be repositioned; keep the vertical center and bottom-left corner relatively open, since that's where these rows sit by default.",
  "cardGuidelines.colorHeading": "Color & contrast",
  "cardGuidelines.colorBody": "Card backgrounds today are patterns/gradients and plain colors, not uploaded images — text color auto-contrasts against whatever background is chosen unless manually overridden. Design your pattern's palette with enough range that both a light and dark auto-picked text color would stay readable on it.",
  "cardGuidelines.checklistHeading": "Before you submit",
  "cardGuidelines.checklistBody": "- Preview your card at both a narrow (phone) and wide (desktop) width — the ratio is fixed, but check nothing you drew assumes a specific container size.\n- Check readability with the network badge, chip, and card number in their default positions.\n- Pick a name that describes the look itself (e.g. \"Midnight Wave\"), not a specific bank or brand.\n- Submissions are reviewed before appearing in Premade Cards for everyone.",
  "wallet.templateNameLabel": "Template name",
  "wallet.templateSubmittedDesc": "Submitted for review. You'll be able to use it once it's approved.",
  "wallet.premadeCardsLabel": "Premade Cards",
  "wallet.templateReviewTitle": "Manage Cards",
  "wallet.noTemplatesToReview": "Nothing to review right now.",
  "wallet.unknownSubmitter": "Unknown submitter",
  "wallet.approveTemplate": "Approve",
  "wallet.rejectTemplate": "Reject",
  "wallet.forceTogglesLabel": "Force settings",
  "wallet.forceTogglesDesc": "Checked toggles are locked to their current value for anyone using this template.",
  "wallet.forceOn": "shown",
  "wallet.forceOff": "hidden",
  "wallet.confirmDeleteTemplateDesc": "This permanently deletes the template. Anyone who already applied it to a wallet keeps that look — only the template itself goes away.",
  "wallet.forceLabelName": "Name on card",
  "wallet.forceLabelNetworkBadge": "Network badge",
  "wallet.forceLabelChip": "Chip",
  "wallet.forceLabelNfc": "NFC",
  "wallet.forceLabelCardNumber": "Card number",
  "wallet.forceLabelBalance": "Balance on card",
  "wallet.forceLabelCurrency": "Currency on card",
  "wallet.forceLabelHolderName": "Holder name",
  "wallet.forceLabelExpiry": "Expiry date",
  "wallet.forceAuto": "Auto",
  "wallet.showHolderNameLabel": "Show holder name",
  "wallet.showHolderNameDesc": "Show the cardholder name on the card face.",
  "wallet.showExpiryLabel": "Show expiry date",
  "wallet.showExpiryDesc": "Show the expiry date on the card face.",
  "wallet.lockCurrencyLabel": "Lock currency",
  "wallet.lockCurrencyDesc": "Anyone using this template gets their wallet's currency forced to {currency}.",
  "wallet.lockCurrencyOffDesc": "Leaves whatever currency the picking wallet already has.",
  "wallet.templateCountryLabel": "Country",
  "wallet.templateCountryPlaceholder": "e.g. Japan",
  "wallet.templateOtherCountryLabel": "Other",
  "wallet.namePositionLabel": "Name position",
  "wallet.lockTextColorLabel": "Lock text color",
  "wallet.lockTextColorDesc": "Anyone who picks this template gets its text color locked in, not just suggested.",
  "wallet.lockSvgColorsLabel": "Lock SVG colors",
  "wallet.lockSvgColorsDesc": "Anyone who picks this template gets its uploaded SVG background colors locked in, not just suggested — the \"Edit colors\" option stays hidden.",
  "wallet.forceNamePositionLabel": "Force name position",
  "wallet.forceNamePositionDesc": "Pin the cardholder-name text to a specific corner for anyone who picks this template.",
  "wallet.forceNfcPositionLabel": "Force NFC position",
  "wallet.forceChipPositionLabel": "Force chip position",
  "wallet.forceCardNumberPositionLabel": "Force card-number position",
  "wallet.forceNfcPositionDesc": "Pin the NFC symbol to a specific corner for anyone who picks this template.",
  "wallet.forceChipPositionDesc": "Pin the EMV chip to a specific corner for anyone who picks this template. Only applies when \"Show chip\" is on.",
  "wallet.forceCardNumberPositionDesc": "Pin the masked card-number row to a specific spot for anyone who picks this template. Only applies when the card number is shown.",
  "wallet.nfcSizeLabel": "NFC size",
  "wallet.nfcSizeSmall": "Small",
  "wallet.nfcSizeBig": "Big",
  "wallet.forceNfcSizeLabel": "Force NFC size",
  "wallet.forceNfcSizeDesc": "Pin the NFC symbol to a specific size for anyone who picks this template.",
  "wallet.templateCategoryLabel": "Card type",
  "wallet.templateCategoryAll": "All",
  "wallet.templateCategoryEMoney": "E-money",
  "wallet.templateCategoryCreditCard": "Credit card",
  "wallet.templateCategoryDebitCard": "Debit card",
  "wallet.templateCategoryTransitCard": "Transit card",
  "wallet.templateCategoryIdCard": "ID card",
  "wallet.templateCategoryMembership": "Membership",
  "wallet.templateCategoryOther": "Other",
  "wallet.forceNetworkLabel": "Force network",
  "wallet.forceNetworkDesc": "Pin the card network for anyone who picks this template, since it's already part of the artwork.",
  "wallet.tabBasics": "Basics",
  "wallet.tabCardDetails": "Card details",
  "wallet.tabLook": "Look",
  "wallet.tabTemplate": "Template",
  "wallet.chipSectionLabel": "Chip",
  "wallet.cardFaceSectionLabel": "Card face",
  "wallet.onCardDisplayLabel": "On-card display",
  "wallet.templateDetailsLabel": "Details",
  "wallet.templateLocksLabel": "Locks",
  "wallet.cardNumberLast4OnlyLabel": "Show last 4 digits only",
  "wallet.cardNumberLast4OnlyDesc": "Shows just \"1234\" instead of the full masked \"•••• •••• •••• 1234\" row.",
  "wallet.cardNumberPositionLabel": "Card number position",
  "wallet.showNetworkBadgeLabel": "Show network badge",
  "wallet.showNetworkBadgeDesc": "Displays a small generic network mark on the card. No real brand logo is used.",
  "wallet.badgePositionLabel": "Badge position",
  "wallet.badgePositionTopLeft": "Top left",
  "wallet.badgePositionTopRight": "Top right",
  "wallet.badgePositionBottomLeft": "Bottom left",
  "wallet.badgePositionBottomRight": "Bottom right",
  "wallet.showChipLabel": "Show chip",
  "wallet.showChipDesc": "Displays the EMV contact chip on the card.",
  "wallet.showNfcLabel": "Show NFC",
  "wallet.showNfcDesc": "Displays the contactless/NFC symbol on the card.",
  "wallet.nfcPositionLabel": "NFC position",
  "wallet.chipColorLabel": "Chip color",
  "wallet.chipColorGold": "Gold",
  "wallet.chipColorSilver": "Silver",
  "wallet.chipColorRoseGold": "Rose Gold",
  "wallet.chipColorGraphite": "Graphite",
  "wallet.chipColorCopper": "Copper",
  "wallet.chipPositionLabel": "Chip position",
  "wallet.chipPositionTop": "Top",
  "wallet.chipPositionMiddle": "Middle",
  "wallet.chipPositionBottom": "Bottom",
  "wallet.chipPositionTopLeft": "Top left",
  "wallet.chipPositionTopCenter": "Top center",
  "wallet.chipPositionTopRight": "Top right",
  "wallet.chipPositionMiddleLeft": "Middle left",
  "wallet.chipPositionMiddleCenter": "Middle center",
  "wallet.chipPositionMiddleRight": "Middle right",
  "wallet.chipPositionBottomLeft": "Bottom left",
  "wallet.chipPositionBottomCenter": "Bottom center",
  "wallet.chipPositionBottomRight": "Bottom right",
  "walletTransfer.title": "Transfer between wallets",
  "walletTransfer.from": "From",
  "walletTransfer.to": "To",
  "walletTransfer.amountLabel": "Amount",
  "walletTransfer.notesLabel": "Notes (optional)",
  "walletTransfer.notesPlaceholder": "Add a note...",
  "walletTransfer.toAmountLabel": "Amount received ({currency})",
  "walletTransfer.toAmountHint": "Estimated from today's exchange rate — edit if you know the exact amount.",
  "walletTransfer.converting": "Converting...",
  "walletTransfer.movesPrefix": "Moves",
  "walletTransfer.movesSuffix": "without counting as income or spending — same as any other transfer.",
  "walletTransfer.transferring": "Transferring...",
  "category.editTitle": "Edit category",
  "category.nameLabel": "Name",
  "category.nameLockedNote": "\"Other\" can't be renamed — it's used as the fallback category.",
  "category.colorLabel": "Color",
  "category.iconLabel": "Icon (optional)",
  "category.none": "None",
  "category.icon.cart": "Shopping",
  "category.icon.burger": "Fast food",
  "category.icon.coffee": "Coffee",
  "category.icon.car": "Car",
  "category.icon.bus": "Transit",
  "category.icon.plane": "Travel",
  "category.icon.home": "Housing",
  "category.icon.bulb": "Utilities",
  "category.icon.shield": "Insurance",
  "category.icon.movie": "Movies",
  "category.icon.game": "Gaming",
  "category.icon.book": "Reading",
  "category.icon.health": "Health",
  "category.icon.pill": "Pharmacy",
  "category.icon.beauty": "Beauty",
  "category.icon.baby": "Childcare",
  "category.icon.pet": "Pets",
  "category.icon.gift": "Gifts",
  "category.icon.gradcap": "Education",
  "category.icon.fitness": "Fitness",
  "category.icon.art": "Hobbies",
  "category.icon.music": "Music",
  "category.icon.phone": "Phone",
  "category.icon.receipt": "Bills",
  "category.icon.tool": "Repairs",
  "category.icon.box": "Packages",
  "category.icon.shirt": "Clothing",
  "category.icon.card": "Card fees",
  "category.icon.cash": "Cash",
  "category.icon.bank": "Banking",
  "category.icon.chart": "Investing",
  "category.icon.wine": "Bar",
};
