Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:{ html:'<a href="https://help.rallydev.com/apps/2.0rc3/doc/">App SDK 2.0rc3 Docs</a>'},
    
    //declaring all global variables.
    industryEpicStore : undefined,          //stores all epics of Industry Solutions.
    epicComboStore : undefined,             //store all data to be displayed in Epic Combo.
    selectedIndustryEpicID: undefined,      //contains selected Industry Epic ID
    selectedIndustryEpicData: undefined,    //contains selected Industry Epic data
    epicCheckBoxChecked: false,             //captures the current check box checked value.
    filteredEpicDataForCombo: undefined,    //contains all the filtered epics for combo.
    
    launch: function() {
        //setting up the container for control layout.
        this.globalContainer = Ext.create('Ext.container.Container',{
            layout: {
                type: 'vbox',
                align: 'left',
                padding: 10
            }
        });
        this.add(this.globalContainer);
        
        this.topContainer = Ext.create('Ext.container.Container',{
            layout: {
                type: 'hbox',
                align: 'left',
                padding: 10
            }
        });
        this.globalContainer.add(this.topContainer);
        
        this.middleContainer = Ext.create('Ext.container.Container',{
            layout: {
                type: 'vbox',
                align: 'left',
                padding: 10
            }
        });
        this.globalContainer.add(this.middleContainer);
        
         this.comboBoxContainer = Ext.create('Ext.container.Container',{
            layout: {
                type: 'hbox',
                align: 'left',
                padding: 5
            }
        });
        this.topContainer.add(this.comboBoxContainer);
        
        this.filterContainer = Ext.create('Ext.container.Container',{
            layout: {
                type: 'hbox',
                align: 'left',
                padding: 5
            }
        });
        this.topContainer.add(this.filterContainer);
        
        this._loadEpicFilterControl();
        this._loadIndustryEpicDataStore();
    },
    
    _loadEpicFilterControl: function(){
        console.log('adding check box control.');
        this.epicFilter = Ext.create( 'Ext.form.field.Checkbox', {
                renderTo: Ext.getBody(),
                id: 'industryEpicFilterCheck',
                boxLabel: 'Exclude all "No Entry" or "Launched" Epics. ', 
                name: 'epicFilterCheckBox', 
                inputValue: 'PortfolioItems/Epic ', 
                checked: false,
                width: 250,
                listerners:{
                    change: function(){
                        console.log('checkbox check change event is fired!')
                    },
                    click: function(){
                        console.log('ckeckbox clicked event is fired.!');
                    },
                    scope: this
                }
            });
            
        this.epicFilterButton = Ext.create('Rally.ui.Button',{
            text: 'Filter',
            renderTo: Ext.getBody(),
            handler: this._epicFilterButtonClicked,
            scope: this
        });
        
        //add the check box control to the app container.
        this.filterContainer.add(this.epicFilter);
        this.filterContainer.add(this.epicFilterButton);
    },
    
    _epicFilterButtonClicked: function(){
        
        console.log('Filter Button is clicked!');
        this.epicCheckBoxChecked = this.down('#industryEpicFilterCheck').getValue();
        console.log('The checked value is?', this.epicCheckBoxChecked);
        this._loadIndustryEpicDataStore();
    },
    
    _loadIndustryEpicDataStore: function(){
            
            // If the store exists, just reload data
            if(this.industryEpicStore){
                this.industryEpicStore.load();
            }
            // else create the store
            else{
                    this.industryEpicStore = Ext.create('Rally.data.wsapi.Store', {
                    model: 'PortfolioItem/Epic',
                    fetch: ['Name', 'State', 'FormattedID', 'Owner', 'Tags', 'RefinedEstimate', 'c_TargetLaunch'],
                    autoLoad: true,
                    context: {
                        workspace: '/workspace/1089940415',
                        project: '/project/11656855707',
                        projectScopeUp: false,
                        projectScopeDown: true
                    },
                    listeners: {
                        load: function(myStore, data, success) {
                             this._loadEpicComboBox();
                        },
                        scope:this
                    },
                    sorters: [
                                {
                                    property: 'FormattedID',
                                    direction: 'ASC'
                                }
                            ]
                });
            }
            
        },
        
        _loadEpicComboBox: function(){
            if(this.industryEpicStore)
            {
                //prepare the filtered Epic Data.
                this._createFilteredEpicData();
                
                //get all the epic data for populating combobox.
                this._createAllEpicComboStore();
                
                if(this.epicComboStore)
                {
                    if(this.epicDetailPanel)
                    {
                        this.epicDetailPanel.getForm().findField('name').setValue('');
                        this.epicDetailPanel.getForm().findField('owner').setValue('');
                        this.epicDetailPanel.getForm().findField('refined_estimate').setValue('');
                        this.epicDetailPanel.getForm().findField('target_launch').setValue('');
                    }
                    
                    //if the combo selectorexists. dispose it off.
                    if(this.epicSelector)
                        this.epicSelector.destroy();
                        
                    //create the combo dropdown list control.
                    this.epicSelector = Ext.create('Ext.form.ComboBox',{
                        fieldLabel:'Select Epics: ',
                        itemId:'industryEpicCombobox',
                        store: this.epicComboStore,
                        queryMode: 'local',
                        displayField: 'Name',
                        valueField: 'ID',
                        width: 600,
                        listeners: {
                            select: this._onEpicComboBoxSelect,
                            ready: this._onEpicComboBoxLoad, //need to revisit why this is not firing
                            scope: this
            			}
                    });
                    
                    //add the combo box control to the app container.
                    this.comboBoxContainer.add(this.epicSelector);
                }
            }
        },
        
        _createFilteredEpicData: function(){
            this.filteredEpicDataForCombo = [];
            
            if(this.epicCheckBoxChecked)
            {
                var epicDataCol = [];
                //fetch the epic data for Combo list.
                Ext.Array.each(this.industryEpicStore.getRecords(),function(thisIndustryEpic){
                    var epicState = thisIndustryEpic.get('State');
                    if(epicState!==null)
                    {
                        var epicStateName = epicState.Name;
                        if(epicStateName!==null && epicStateName !== 'Launched')
                            epicDataCol.push(thisIndustryEpic);
                    }
                });
                
                this.filteredEpicDataForCombo = epicDataCol;
            }
            else
                this.filteredEpicDataForCombo = this.industryEpicStore.getRecords();
            
        },
        
        _onEpicFilterClick:function(){
            console.log('checkbox event fired!!!');
            var checkFilter = this.down('#industryEpicFilterCheck').getValue();
            console.log('Checked Current Value', checkFilter);
        },
        
        _onEpicComboBoxLoad: function(){
            console.log('On combo box load....');
        },
        
        _onEpicComboBoxSelect: function(){
            
            //retrive all epic info for selected item.
            this.selectedIndustryEpicID = this.down('#industryEpicCombobox').getValue();
            console.log('Selected value?', this.selectedIndustryEpicID);
            this._loadSelectedEpicDetailsFromStore();
        },
        
        _loadSelectedEpicDetailsFromStore: function(){
            
            if(this.industryEpicStore && this.selectedIndustryEpicID){
                var records = this.industryEpicStore.getRecords();
                var index = this.industryEpicStore.find('FormattedID', this.selectedIndustryEpicID);
                this.selectedIndustryEpicData = records[index];
                this._loadEpicDetailsPanel();
                    
            }
        },
        
        _loadEpicDetailsPanel: function(){
            
            if(this.selectedIndustryEpicData){
                //prepare display data for epic details panel.
                var epicName = this.selectedIndustryEpicData.get('Name');
                var ownerName = this.selectedIndustryEpicData.get('Owner') !== null ? 
                                (this.selectedIndustryEpicData.get('Owner')['_refObjectName'] !== null? 
                                    this.selectedIndustryEpicData.get('Owner')['_refObjectName'] : 'No Owner') 
                                : 'No Owner';
                var refinedEstimate = this.selectedIndustryEpicData.get('RefinedEstimate');
                var targetLaunch = this.selectedIndustryEpicData.get('c_TargetLaunch') !== null?this.selectedIndustryEpicData.get('c_TargetLaunch').toString() : 'No Target Specified';
                
                
                //if the epic panel already exists update the item values.
                if(this.epicDetailPanel)
                {
                    console.log('check for panel form?', this.epicDetailPanel.getForm().getFields());
                    console.log('update existing panel.');
                    console.log('Details Panel?', this.epicDetailPanel);
                    this.epicDetailPanel.getForm().findField('name').setValue(epicName);
                    this.epicDetailPanel.getForm().findField('owner').setValue(ownerName);
                    this.epicDetailPanel.getForm().findField('refined_estimate').setValue(refinedEstimate);
                    this.epicDetailPanel.getForm().findField('target_launch').setValue(targetLaunch);
                }
                //else create the epic details panel and display the epic data.
                else
                {
                    console.log('create new panel.');
                    this.epicDetailPanel = Ext.create('Ext.form.Panel', {
                        renderTo: Ext.getBody(),
                        width: 500,
                        height: 150,
                        layout: {
                            type: 'vbox',
                            align: 'stretch',
                            padding: 10
                        },
                        title: 'Epic Details',
                        items: [
                        {
                            xtype: 'displayfield',
                            fieldLabel: 'Name',
                            name: 'name',
                            value: epicName
                        }, 
                        {
                            xtype: 'displayfield',
                            fieldLabel: 'Owner',
                            name: 'owner',
                            value: ownerName
                        }, 
                        {
                            xtype: 'displayfield',
                            fieldLabel: 'Refined Estimate',
                            name: 'refined_estimate',
                            value: refinedEstimate
                        }, 
                        {
                            xtype: 'displayfield',
                            fieldLabel: 'Target Launch',
                            name: 'target_launch',
                            value: targetLaunch
                        }]
                    });
                    
                    //add the panel to the container.
                    this.middleContainer.add(this.epicDetailPanel);
                }
            }
        },
        
        _createAllEpicComboStore: function(){
            
            if(this.filteredEpicDataForCombo)
            {
                //define the custom model for combo box data.
                Ext.define('Epic', {
                            extend: 'Ext.data.Model',
                            fields: [
                                {name: 'ID',  type: 'string'},
                                {name: 'Name', type: 'string'}
                            ]
                        });
                
                //fetch the epic data for Combo list.
                var epicDataCol = [];
                        
                Ext.Array.each(this.filteredEpicDataForCombo,function(thisIndustryEpic){
                    var epicName = thisIndustryEpic.get('Name');
                    var epicId = thisIndustryEpic.get('FormattedID');
                    var epicComboName = epicId + ': ' + epicName;
                    //console.log('Industry Epic = ', epicComboName);
                    
                    var epicData = Ext.create('Epic',{
                        ID: epicId,
                        Name: epicComboName
                    });
                    
                    epicDataCol.push(epicData);
                });
                
                //create the store for the combo list.            
                this.epicComboStore = Ext.create('Ext.data.Store',{
                    model: 'Epic',
                    data: epicDataCol,
                    autoLoad: true,
                    listeners: {
                        scope:this
                    }
                });
            }
        }
});