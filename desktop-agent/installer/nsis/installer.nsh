!macro customHeader
  !system "echo 'EPI-Q Agent NSIS Installer'"
!macroend

!macro preInit
  SetRegView 64
!macroend

!macro customInit
  ; Check for admin rights for per-machine install
  UserInfo::GetAccountType
  Pop $0
  ${If} $0 == "admin"
    StrCpy $INSTDIR "$PROGRAMFILES64\${PRODUCT_NAME}"
  ${Else}
    StrCpy $INSTDIR "$LOCALAPPDATA\Programs\${PRODUCT_NAME}"
  ${EndIf}
!macroend

!macro customInstall
  ; Create registry entries for enterprise deployment
  WriteRegStr HKLM "SOFTWARE\EPI-Q\Agent" "InstallPath" "$INSTDIR"
  WriteRegStr HKLM "SOFTWARE\EPI-Q\Agent" "Version" "${VERSION}"
  
  ; Create scheduled task for auto-start (optional, controlled by config)
  ; nsExec::ExecToLog 'schtasks /create /tn "EPI-Q Agent" /tr "$INSTDIR\epi-q-agent.exe --hidden" /sc onlogon /rl LIMITED /f'
  
  ; Add to Windows Defender exclusions (requires admin)
  UserInfo::GetAccountType
  Pop $0
  ${If} $0 == "admin"
    nsExec::ExecToLog 'powershell -Command "Add-MpPreference -ExclusionPath \"$INSTDIR\""'
  ${EndIf}
!macroend

!macro customUnInstall
  ; Remove registry entries
  DeleteRegKey HKLM "SOFTWARE\EPI-Q\Agent"
  
  ; Remove scheduled task if exists
  nsExec::ExecToLog 'schtasks /delete /tn "EPI-Q Agent" /f'
  
  ; Remove from Windows Defender exclusions
  UserInfo::GetAccountType
  Pop $0
  ${If} $0 == "admin"
    nsExec::ExecToLog 'powershell -Command "Remove-MpPreference -ExclusionPath \"$INSTDIR\""'
  ${EndIf}
!macroend

!macro customRemoveFiles
  ; Remove app data but preserve config
  RMDir /r "$INSTDIR\resources"
  RMDir /r "$INSTDIR\locales"
!macroend
