Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:{ html:'<a href="https://help.rallydev.com/apps/2.0rc2/doc/">App SDK 2.0rc2 Docs</a>'},
    launch: function() {
                    Ext.create('Rally.data.wsapi.Store', {
                        model: 'UserStory',
                        autoLoad: true,
                        listeners: {
                            load: this._onDataLoaded,
                            scope: this
                        }
                    });
                },
            
                _onDataLoaded: function(store, data) {
                    var records = [];
                    Ext.Array.each(data, function(record) {
                        //Perform custom actions with the data here
                        //Calculations, etc.
                        records.push({
                            ScheduleState: record.get('ScheduleState'),
                            Name: record.get('Name'),
                            Tasks: record.get('Tasks').length,
                            Defects: record.get('Defects').length
                        });
                    });
            
                    this.add({
                        xtype: 'rallygrid',
                        store: Ext.create('Rally.data.custom.Store', {
                            data: records,
                            pageSize: 5
                        }),
                        columnCfgs: [
                            {
                                text: 'Name', dataIndex: 'Name', flex: 1
                            },
                            {
                                text: 'Schedule State', dataIndex: 'ScheduleState'
                            },
                            {
                                text: 'Tasks', dataIndex: 'Tasks'
                            },
                            {
                                text: 'Defects', dataIndex: 'Defects'
                            }
                        ]
                    });
                }
});