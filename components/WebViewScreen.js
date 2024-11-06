import React, {useRef, useState} from 'react';
import {View, Alert} from 'react-native';
import {WebView} from 'react-native-webview';
import RNFetchBlob from 'rn-fetch-blob';

const WebViewScreen = () => {
  const webViewRef = useRef(null);
  const [currentUrl, setCurrentUrl] = useState('https://hrms.probooks.in');

  const onNavigationStateChange = navState => {
    const {url} = navState;
    setCurrentUrl(url);
  };

  const handleMessage = event => {
    const {data} = event.nativeEvent;
    const {url} = event.nativeEvent;
    console.log(url);

    const base64Data = data.split(',')[1];
    const fileName = `Payslip_${Date.now()}.pdf`;
    const {fs} = RNFetchBlob;
    const downloads = fs.dirs.DownloadDir;
    const path = `${downloads}/${fileName}`;

    RNFetchBlob.fs
      .writeFile(path, base64Data, 'base64')
      .then(() => {
        RNFetchBlob.android.addCompleteDownload({
          title: fileName,
          description: 'Download complete',
          mime: 'application/pdf',
          path: path,
          showNotification: true,
        });
        Alert.alert('Download Complete', `File downloaded to ${path}`);
      })
      .catch(error => {
        Alert.alert(
          'Download Failed',
          'An error occurred while writing the file.',
        );
        console.error('Error writing file:', error);
      });
  };

  return (
    <View style={{flex: 1}}>
      <WebView
        ref={webViewRef}
        source={{uri: currentUrl}}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        startInLoadingState={true}
        geolocationEnabled={true}
        allowFileAccess={true}
        originWhitelist={['*']}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onNavigationStateChange={onNavigationStateChange}
        allowUniversalAccessFromFileURLs={true}
        blobDownloadingEnabled={true}
        onMessage={handleMessage}
        allowsBackForwardNavigationGestures={true}
        injectedJavaScript={`
          (function() {
            document.addEventListener('click', function(event) {
              const target = event.target;
              if (target.tagName === 'A' && target.href.startsWith('blob:')) {
                event.preventDefault();
                fetch(target.href)
                  .then(response => response.blob())
                  .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = function() {
                      const base64data = reader.result;
                      window.ReactNativeWebView.postMessage(base64data);
                    };
                    reader.readAsDataURL(blob);
                  })
                  .catch(error => console.error('Error fetching blob:', error));
              }
            }, true);
          })();
        `}
      />
    </View>
  );
};

export default WebViewScreen;
