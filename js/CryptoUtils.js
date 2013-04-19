Ext.define('Certificate', {
    extend: 'Ext.data.Model',
    idProperty: 'Thumbprint',
    fields: [{
            name: 'SubjectDisplayName',
            type: 'string'
        }, {
            name: 'IssuerDisplayName',
            type: 'string'
        }, {
            name: 'IssuerName',
            type: 'string'
        }, {
            name: 'SerialNumber',
            type: 'string'
        }, {
            name: 'SubjectName',
            type: 'string'
        }, {
            name: 'Thumbprint',
            type: 'string'
        }, {
            name: 'ValidFromDate',
            type: 'date'
        }, {
            name: 'ValidToDate',
            type: 'date'
        }, {
            name: 'Version',
            type: 'string'
        }, {
            name: 'PublicKey',
            type: 'string'
        }]
});
Ext.define('TM.cls.CryptoUtils.CertificateInfo', {
    extend: 'Ext.window.Window',
    closeAction: 'destroy',
    width: 420,
    height: 500,
    layout: 'vbox',
    certificate: undefined,
    initComponent: function() {
        Ext.apply(this, {
            title: 'Свойства сертификата',
            items: [{
                    xtype: 'propertygrid',
                    width: '100%',
                    flex: 1,
                    sortableColumns: false,
                    nameColumnWidth: 200,
                    source: this.buildSource(this.certificate),
                    listeners: {
                        selectionchange: function(v, recs) {
                            if (recs.length > 0)
                                this.down('textarea').setValue(this.processValue(recs[0]));
                            else
                                this.down('textarea').setValue('');
                        },
                        beforeedit: function() {
                            return false;
                        },
                        scope: this
                    }
                }, {
                    xtype: 'textarea',
                    width: '100%',
                    flex: 1,
                    readOnly: true,
                }
            ],
            buttons: [{
                    text: 'OK',
                    handler: function() {
                        this.close();
                    },
                    scope: this
                }]
        });
        this.callParent(arguments);
    },
    buildSource: function(certificate) {
        return {
            'Версия': certificate.Version,
            'Серийный номер': certificate.SerialNumber,
            'Алгоритм подписи': certificate.Algorithm,
            'Алгоритм хэширования подписи': certificate.Algorithm,
            'Издатель': certificate.IssuerName,
            'Действителен с': Ext.Date.format(certificate.ValidFromDate, 'j.m.Y'),
            'Действителен по': Ext.Date.format(certificate.ValidToDate, 'j.m.Y'),
            'Субъект': certificate.SubjectName,
            'Открытый ключ': certificate.PublicKey,
            'Алгоритм отпечатака': 'sha1',
            'Отпечаток': certificate.Thumbprint
        };
    },
    processList: function(txt) {
        var res = [],
                c = '',
                buf = '',
                key = '',
                keyStart = true.
                i,
                l = txt.length;
        for (i = 0; i < l; i++) {
            c = txt.charAt(i);
            switch (c) {
                case ' ': // игнорируем пока не начался ключ
                    if (!keyStart)
                        buf += c;
                    break;
                case '=': // разделитель ключ - значение
                    key = buf;
                    buf = '';
                    break;
                case ',': // разделитель параметров
                    res.push(key + ' = ' + buf);
                    buf = '';
                    keyStart = true;
                    break;
                case '"': // произвольный текст, кавычки экранируются кавычками
                    i++;
                    for (; i < l; i++) {
                        c = txt.charAt(i);
                        if (c === '"') {
                            if ((i + 1 < l) && (txt.charAt(i + 1) === '"')) {
                                i++;
                                buf += c;
                            } else
                                break;
                        } else
                            buf += c;
                    }
                    break;
                default:
                    buf += c;
                    keyStart = false;
            }
        }
        if (buf.length > 0) {
            res.push(key + ' = ' + buf);
        }
        return res.join('\n');
    },
    processValue: function(rec) {
        var name = rec.get('name');
        var value = rec.get('value');
        if ((name === 'Издатель') || (name === 'Субъект'))
            return this.processList(value);
        else
            return '' + value; // нужна строка
    }

});
Ext.define('TM.cls.CryptoUtils.CertificateSelector', {
    extend: 'Ext.window.Window',
    closeAction: 'destroy',
    plain: true,
    layout: 'vbox',
    width: 440,
    selectCaption: 'Выберите сертификат',
    store: undefined,
    certificate: undefined,
    initComponent: function() {
        Ext.apply(this, {
            title: 'Выбор сертификата',
            items: [{
                    border: false,
                    width: '100%',
                    html: '<div class="certificate-title">' + this.selectCaption + '</div>'
                }, {
                    border: false,
                    flex: 1,
                    width: '100%',
                    items: [
                        this.createView()
                    ]
                }],
            buttons: [{
                    text: 'OK',
                    handler: function() {
                        this.fireEvent('ready', this, this.getSelectedItem().data);
                        this.close();
                    },
                    scope: this
                }, {
                    text: 'Отмена',
                    handler: function() {
                        this.close();
                    },
                    scope: this
                }]
        });
        this.callParent(arguments);
    },
    createView: function() {
        this.view = Ext.create('widget.dataview', {
            store: this.store,
            selModel: {
                mode: 'SINGLE'
            },
            trackOver: true,
            autoScroll: true,
            cls: 'certificate-list',
            itemSelector: '.certificate-list-item',
            overItemCls: 'certificate-list-item-hover',
            tpl: new Ext.XTemplate(
                    '<tpl for=".">',
                    '<div class="certificate-list-item x-unselectable {[this.getItemClass(values)]}">',
                    '<h1>{SubjectDisplayName}</h1>',
                    '<h2>Издатель: {IssuerDisplayName}</h2>',
                    '<h2>Действителен с: {[this.getValidDates(values)]}</h2>',
                    '</div></tpl>', {
                getItemClass: function(values) {
                    return 'certificate-icon';
                },
                getValidDates: function(values) {
                    return Ext.Date.format(values.ValidFromDate, 'j.m.Y') + ' по ' + Ext.Date.format(values.ValidToDate, 'j.m.Y');
                }
            })
        });
        this.view.on('itemdblclick', this.onDblClick, this);
        return this.view;
    },
    onBoxReady: function() {
        this.callParent(arguments);
        var rec = this.store.first();
        this.view.getSelectionModel().select(rec);
    },
    onDblClick: function(view, rec) {
        this.fireEvent('ready', this, rec.data);
        this.close();
        //TM.cls.CryptoUtils.showCertificateInfo(rec.data);
    },
    getSelectedItem: function() {
        return this.view.getSelectionModel().getSelection()[0] || false;
    }
});
Ext.define('TM.cls.CryptoUtils', {
    singleton: true,
    // constants
    CAPICOM_CERT_INFO_TYPE: {
        CAPICOM_CERT_INFO_SUBJECT_SIMPLE_NAME: 0,
        CAPICOM_CERT_INFO_ISSUER_SIMPLE_NAME: 1,
        CAPICOM_CERT_INFO_SUBJECT_EMAIL_NAME: 2,
        CAPICOM_CERT_INFO_ISSUER_EMAIL_NAME: 3,
        CAPICOM_CERT_INFO_SUBJECT_UPN: 4,
        CAPICOM_CERT_INFO_ISSUER_UPN: 5,
        CAPICOM_CERT_INFO_SUBJECT_DNS_NAME: 6,
        CAPICOM_CERT_INFO_ISSUER_DNS_NAME: 7
    },
    CAPICOM_CERTIFICATE_FIND_TYPE: {
        CAPICOM_CERTIFICATE_FIND_SHA1_HASH: 0,
        CAPICOM_CERTIFICATE_FIND_SUBJECT_NAME: 1,
        CAPICOM_CERTIFICATE_FIND_ISSUER_NAME: 2,
        CAPICOM_CERTIFICATE_FIND_ROOT_NAME: 3,
        CAPICOM_CERTIFICATE_FIND_TEMPLATE_NAME: 4,
        CAPICOM_CERTIFICATE_FIND_EXTENSION: 5,
        CAPICOM_CERTIFICATE_FIND_EXTENDED_PROPERTY: 6,
        CAPICOM_CERTIFICATE_FIND_APPLICATION_POLICY: 7,
        CAPICOM_CERTIFICATE_FIND_CERTIFICATE_POLICY: 8,
        CAPICOM_CERTIFICATE_FIND_TIME_VALID: 9,
        CAPICOM_CERTIFICATE_FIND_TIME_NOT_YET_VALID: 10,
        CAPICOM_CERTIFICATE_FIND_TIME_EXPIRED: 11,
        CAPICOM_CERTIFICATE_FIND_KEY_USAGE: 12
    },
    CAPICOM_ENCODING_TYPE: {
        CAPICOM_ENCODE_ANY: 0xffffffff,
        CAPICOM_ENCODE_BASE64: 0,
        CAPICOM_ENCODE_BINARY: 1
    },
    CADESCOM_CADES_TYPE: {
        CADESCOM_CADES_DEFAULT: 0,
        CADESCOM_CADES_BES: 1,
        CADESCOM_CADES_X_LONG_TYPE_1: 0x5d
    },
    CADESCOM_ATTRIBUTE: {
        CADESCOM_AUTHENTICATED_ATTRIBUTE_SIGNING_TIME: 0,
        CADESCOM_AUTHENTICATED_ATTRIBUTE_DOCUMENT_NAME: 1,
        CADESCOM_AUTHENTICATED_ATTRIBUTE_DOCUMENT_DESCRIPTION: 2,
        CADESCOM_ATTRIBUTE_OTHER: 0xffffffff
    },
    CAPICOM_CERTIFICATE_INCLUDE_OPTION: {
        CAPICOM_CERTIFICATE_INCLUDE_CHAIN_EXCEPT_ROOT: 0,
        CAPICOM_CERTIFICATE_INCLUDE_WHOLE_CHAIN: 1,
        CAPICOM_CERTIFICATE_INCLUDE_END_ENTITY_ONLY: 2
    },
// methods
    checkPlugin: function() {
        switch (navigator.appName) {
            case 'Microsoft Internet Explorer':
                try {
                    var obj = new ActiveXObject("CAdESCOM.CPSigner");
                    return obj !== null;
                }
                catch (err) {
                }
                break;
            default:
                var mimetype = navigator.mimeTypes["application/x-cades"];
                if (mimetype) {
                    var plugin = mimetype.enabledPlugin;
                    if (plugin) {
                        return true;
                    }
                }
        }
        return false;
    },
    createObject: function(name) {
        if (Ext.isIE) {
            return new ActiveXObject(name);
        } else {
            var cadesobject = document.getElementById("cadesplugin");
            return cadesobject.CreateObject(name);
        }
    },
    decimalToHexString: function(number) {
        if (number < 0) {
            number = 0xFFFFFFFF + number + 1;
        }

        return number.toString(16).toUpperCase();
    },
    getErrorMessage: function(e) {
        var err = e.message;
        if (!err) {
            err = e;
        } else if (e.number) {
            err += " (0x" + decimalToHexString(e.number) + ")";
        }
        return err;
    },
    convertDate: function(date) {
        if (Ext.isIE) {
            return date.getVarDate();
        } else
            return date;
    },
    getCertificateItem: function(cert) {
        return {
            SubjectDisplayName: cert.GetInfo(this.CAPICOM_CERT_INFO_TYPE.CAPICOM_CERT_INFO_SUBJECT_SIMPLE_NAME),
            IssuerDisplayName: cert.GetInfo(this.CAPICOM_CERT_INFO_TYPE.CAPICOM_CERT_INFO_ISSUER_SIMPLE_NAME),
            IssuerName: cert.IssuerName,
            SerialNumber: cert.SerialNumber,
            SubjectName: cert.SubjectName,
            Thumbprint: cert.Thumbprint,
            ValidFromDate: new Date(cert.ValidFromDate), // в IE тут что-то отличное от js Date
            ValidToDate: new Date(cert.ValidToDate),
            Version: cert.Version,
            PublicKey: cert.PublicKey().Algorithm.FriendlyName
        };
    },
    getCertificateStore: function() {
        var oStore = this.createObject("CAPICOM.store");
        if (!oStore) {
            return "Ошибка создания объекта хранилища";
        }

        try {
            oStore.Open();
        }
        catch (e) {
            return "Ошибка при открытии хранилища: " + this.getErrorMessage(e);
        }

        var store = Ext.create('Ext.data.ArrayStore', {
            model: 'Certificate'
        });
        var certCnt = oStore.Certificates.Count;
        for (var i = 1; i <= certCnt; i++) {
            var cert;
            try {
                cert = oStore.Certificates.Item(i);
            }
            catch (ex) {
                return "Ошибка при перечислении сертификатов: " + this.getErrorMessage(ex);
            }

            try {
                store.add(this.getCertificateItem(cert));
            }
            catch (e) {
                return "Ошибка при обработке сертификата: " + this.getErrorMessage(e);
            }
        }
        oStore.Close();
        return store;
    },
    selectCertificate: function(config) {
        config = config || {};
        var store = config.store || this.getCertificateStore();
        if (typeof store === 'string') {
            alert(store);
        } else {
            var win = Ext.create('TM.cls.CryptoUtils.CertificateSelector', {
                store: store,
                selectCaption: config.selectCaption || 'Выберите сертификат',
                modal: true,
                listeners: {
                    ready: function(sender, data) {
                        Ext.callback(config.handler || Ext.emptyFn, config.scope || this, [this, data]);
                    }
                }
            });
            win.show();
        }
    },
    showCertificateInfo: function(certificate) {
        var win = Ext.create('TM.cls.CryptoUtils.CertificateInfo', {
            certificate: certificate,
            modal: true
        });
        win.show();
    },
    signData: function(config) {
        var oStore;
        var res = {success: false};
        try {
            oStore = this.createObject("CAPICOM.store");
            oStore.Open();
        } catch (e) {
            res.error = "Ошибка при открытии хранилища: " + this.getErrorMessage(e);
            return res;
        }

        var oCerts = oStore.Certificates.Find(this.CAPICOM_CERTIFICATE_FIND_TYPE.CAPICOM_CERTIFICATE_FIND_SHA1_HASH, config.thumbprint);
        if (oCerts.Count === 0) {
            return "Не найден сертификат";
        }
        var oCert = oCerts.Item(1);
        try {
            var oSigner = this.createObject("CAdESCOM.CPSigner");
            oSigner.Certificate = oCert;
        } catch (e) {
            res.error = "Ошибка при создания объекта для подписи: " + this.getErrorMessage(e);
            return res;
        }

        var oSignedData = this.createObject("CAdESCOM.CadesSignedData");
        if (config.content) {
            oSignedData.Content = config.content;
            if (config.tsaAddress) {
                oSigner.TSAAddress = config.tsaAddress;
            }
            oSigner.Options = config.options || this.CAPICOM_CERTIFICATE_INCLUDE_OPTION.CAPICOM_CERTIFICATE_INCLUDE_WHOLE_CHAIN;
            if (Ext.isArray(config.attributes)) {
                Ext.Array.each(config.attributes, function(value) {
                    var oAttr = this.createObject("CADESCOM.CPAttribute");
                    oAttr.Name = value.name;
                    if (Ext.isDate(value.value))
                        oAttr.Value = this.convertDate(value.value);
                    else
                        oAttr.Value = value.value;
                    oSigner.AuthenticatedAttributes2.Add(oAttr);
                }, this);
            }

            try {
                res.data = oSignedData.SignCades(oSigner, config.cadesType || this.CADESCOM_CADES_TYPE.CADESCOM_CADES_BES, config.detached || false);
                res.content = oSignedData.Content;
            }
            catch (e) {
                res.error = "Не удалось создать подпись из-за ошибки: " + this.getErrorMessage(e);
                return res;
            }
        } else {
            res.error = "Не указаны данные для подписания";
            return res;
        }
        oStore.Close();
        res.success = true;
        return res;
    },
    verify: function(config) {
        var res = {success: false};
        var oSignedData = this.createObject("CAdESCOM.CadesSignedData");
        try {
            oSignedData.Content = config.content;
            oSignedData.VerifyCades(config.signedMessage, config.cadesType, config.detached || false);
            res.content = oSignedData.Content;
            res.signers = this.getSignersArray(oSignedData.Signers);
        } catch (e) {
            res.error = "Не удалось проверить подпись из-за ошибки: " + this.getErrorMessage(e);
            return res;
        }
        res.success = true;
        return res;
    },
    getSignersArray: function(oSigners) {
        res = [];
        var certCnt = oSigners.Count,
                signer,
                attrCnt,
                attrs,
                attr;
        for (var i = 1; i <= certCnt; i++) {
            try {
                signer = oSigners.Item(i);
            }
            catch (e) {
                return "Ошибка при перечислении подписчиков: " + this.getErrorMessage(e);
            }
            try {
                attrs = [];
                try {
                    attrs.push({
                        name: this.CADESCOM_ATTRIBUTE.CADESCOM_AUTHENTICATED_ATTRIBUTE_SIGNING_TIME,
                        value: signer.SigningTime
                    });
                } catch (e) {
                }
                attrCnt = signer.AuthenticatedAttributes2.Count;
                for (var a = 1; a <= attrCnt; a++) {
                    try {
                        attr = signer.AuthenticatedAttributes2.Item(a);
                        attrs.push({
                            name: attr.Name,
                            value: attr.Value
                        });
                    } catch (e) {
// атрибут по какой-то причине может не давать обращаться к полю Value
// также может быть ошибка при получении самого атрибута
                    }
                }
                res.push({
                    attributes: attrs,
                    certificate: this.getCertificateItem(signer.Certificate)
                });
            }
            catch (e) {
                return "Ошибка при обработке сертификата: " + this.getErrorMessage(e);
            }
        }
        return res;
    }
});