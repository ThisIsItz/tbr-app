package expo.modules.savefile

import android.app.Activity
import android.content.Context
import android.content.Intent
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.toCodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val CREATE_DOCUMENT_CODE = 62381

class SavingInProgressException :
  CodedException("Different file saving already in progress. Await it first.")

class FailedToOpenOutputStreamException :
  CodedException("Failed to open an output stream for the chosen location.")

class SaveFileModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private var pendingPromise: Promise? = null
  private var pendingContents: String? = null

  override fun definition() = ModuleDefinition {
    Name("SaveFile")

    AsyncFunction("saveFileAsync") { filename: String, mimeType: String, contents: String, promise: Promise ->
      if (pendingPromise != null) {
        throw SavingInProgressException()
      }
      pendingPromise = promise
      pendingContents = contents

      val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE)
        type = mimeType
        putExtra(Intent.EXTRA_TITLE, filename)
      }
      appContext.throwingActivity.startActivityForResult(intent, CREATE_DOCUMENT_CODE)
    }

    OnActivityResult { _, (requestCode, resultCode, intent) ->
      if (requestCode != CREATE_DOCUMENT_CODE || pendingPromise == null) {
        return@OnActivityResult
      }

      val promise = pendingPromise!!
      val contents = pendingContents ?: ""
      pendingPromise = null
      pendingContents = null

      val uri = intent?.data
      if (resultCode != Activity.RESULT_OK || uri == null) {
        promise.resolve(false)
        return@OnActivityResult
      }

      try {
        context.contentResolver.openOutputStream(uri)?.use { output ->
          output.write(contents.toByteArray())
        } ?: throw FailedToOpenOutputStreamException()
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject(e.toCodedException())
      }
    }
  }
}
