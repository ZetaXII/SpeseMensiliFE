In android:

sostituire la cartella "res" posizionata in "C:\Users\zakma\Desktop\PROGETTI DEV\SPESE-MENSILI\speseMensiliFE\android\app\src\main"

con la cartella "res" presente qui


---PER COMPILARE LA BUILD ANDROID/CAPACITOR
Remove-Item -Recurse -Force .\android
ionic build
npx cap sync
npx cap add android
[INSERIRE LA CARTELLA "res" COME DETTO PRIMA]
npx cap open android
