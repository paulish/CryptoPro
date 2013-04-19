Утилита ExtJS класс для работы с плагином КриптоПро ЭЦП Browser plug-in
=======================================================================

Условия требуемые для работы доступны по ссылке: http://www.cryptopro.ru/cadesplugin/Manual.aspx

Разрабатывалось под ExtJS 4.1.

Примеры использования:

1. Проверка наличия установленного плагина:

if (!TM.cls.CryptoUtils.checkPlugin()) {
  alert('Плагин не загружен');
  return;
}

2. Создание отделенной подписи:

var content = 'Текст для подписи';
TM.cls.CryptoUtils.selectCertificate({
    handler: function(sender, data) {    
      var res = TM.cls.CryptoUtils.signData({
        thumbprint: data.Thumbprint,
        content: content,
        cadesType: TM.cls.CryptoUtils.CADESCOM_CADES_TYPE.CADESCOM_CADES_BES,
        detached: true,
        attributes: [{
            name: TM.cls.CryptoUtils.CADESCOM_ATTRIBUTE.CADESCOM_AUTHENTICATED_ATTRIBUTE_SIGNING_TIME,
            value: new Date()
          }, {
            name: TM.cls.CryptoUtils.CADESCOM_ATTRIBUTE.CADESCOM_AUTHENTICATED_ATTRIBUTE_DOCUMENT_NAME,
            value: 'Тестовый документ'
          }]
        });
        if (res.success) {
           // Действия в случае удачного подписания
        } else
          Ext.Msg.alert('Ошибка', res.error);
    },
    scope: this
});

3. Проверка отделенной подписи:

var content = 'Текст для подписи';
res = TM.cls.CryptoUtils.verify({
  content: content,
  signedMessage: res.data,
  cadesType: TM.cls.CryptoUtils.CADESCOM_CADES_TYPE.CADESCOM_CADES_BES,
  detached: true
});
if (res.success) {
  var signers = res.signers;
  if (signers.length > 0)
    TM.cls.CryptoUtils.showCertificateInfo(signers[0].certificate);
  else
    Ext.Msg.alert('Ошибка', 'Не найден сертификат подписи при ее проверке');
}
else
  Ext.Msg.alert('Ошибка', res.error);
