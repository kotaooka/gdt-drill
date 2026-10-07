import java.util.Properties

plugins {
    id("com.android.application")
}

// 署名：鍵ファイルとパスワードはリポジトリに入れない。
//  - GitHub Actions：Secrets から復元した鍵を環境変数で渡す（.github/workflows/android.yml）
//  - 手元でビルドする場合：android/keystore.properties に storeFile / storePassword / keyAlias / keyPassword を書く（.gitignore 済み）
// ※ android { } の中では `java` が別の意味になるため、読み込みはここ（外側）で行う
val ksProps = Properties().also { p ->
    val f = rootProject.file("keystore.properties")
    if (f.exists()) f.inputStream().use { p.load(it) }
}
fun conf(env: String, key: String): String? = System.getenv(env) ?: ksProps.getProperty(key)
val ksFile: String? = conf("KEYSTORE_FILE", "storeFile")

android {
    namespace = "app.gdtdrill"
    compileSdk = 34

    defaultConfig {
        applicationId = "app.gdtdrill"
        minSdk = 26
        targetSdk = 34
        // CI から版数を渡す（指定がなければ下の既定値）
        versionCode = (System.getenv("VERSION_CODE") ?: "1").toInt()
        versionName = System.getenv("VERSION_NAME") ?: "0.6.1"
    }

    signingConfigs {
        if (ksFile != null) create("shared") {
            storeFile = file(ksFile!!)
            storePassword = conf("KEYSTORE_PASSWORD", "storePassword")
            keyAlias = conf("KEY_ALIAS", "keyAlias") ?: "gdt"
            keyPassword = conf("KEY_PASSWORD", "keyPassword")
        }
    }

    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
            // 鍵が無いときは署名なしの APK になる（インストールはできない）
            signingConfigs.findByName("shared")?.let { signingConfig = it }
        }
    }

    // Web版のビルド結果（docs/index.html）をそのままアプリに同梱する
    sourceSets {
        getByName("main") {
            assets.srcDir("../../docs")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    lint {
        checkReleaseBuilds = false
    }
}

dependencies {
    implementation("androidx.webkit:webkit:1.11.0")
}
