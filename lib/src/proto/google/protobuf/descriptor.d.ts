export declare const protobufPackage = "google.protobuf";
export interface FileDescriptorSet {
    file: FileDescriptorProto[];
}
export interface FileDescriptorProto {
    name: string;
    package: string;
    dependency: string[];
    public_dependency: number[];
    weak_dependency: number[];
    message_type: DescriptorProto[];
    enum_type: EnumDescriptorProto[];
    service: ServiceDescriptorProto[];
    extension: FieldDescriptorProto[];
    options: FileOptions | undefined;
    source_code_info: SourceCodeInfo | undefined;
    syntax: string;
}
export interface DescriptorProto {
    name: string;
    field: FieldDescriptorProto[];
    extension: FieldDescriptorProto[];
    nested_type: DescriptorProto[];
    enum_type: EnumDescriptorProto[];
    extension_range: DescriptorProto_ExtensionRange[];
    oneof_decl: OneofDescriptorProto[];
    options: MessageOptions | undefined;
    reserved_range: DescriptorProto_ReservedRange[];
    reserved_name: string[];
}
export interface DescriptorProto_ExtensionRange {
    start: number;
    end: number;
}
export interface DescriptorProto_ReservedRange {
    start: number;
    end: number;
}
export interface FieldDescriptorProto {
    name: string;
    number: number;
    label: FieldDescriptorProto_Label;
    type: FieldDescriptorProto_Type;
    type_name: string;
    extendee: string;
    default_value: string;
    oneof_index: number;
    json_name: string;
    options: FieldOptions | undefined;
}
export declare const FieldDescriptorProto_Type: {
    readonly TYPE_DOUBLE: "TYPE_DOUBLE";
    readonly TYPE_FLOAT: "TYPE_FLOAT";
    readonly TYPE_INT64: "TYPE_INT64";
    readonly TYPE_UINT64: "TYPE_UINT64";
    readonly TYPE_INT32: "TYPE_INT32";
    readonly TYPE_FIXED64: "TYPE_FIXED64";
    readonly TYPE_FIXED32: "TYPE_FIXED32";
    readonly TYPE_BOOL: "TYPE_BOOL";
    readonly TYPE_STRING: "TYPE_STRING";
    readonly TYPE_GROUP: "TYPE_GROUP";
    readonly TYPE_MESSAGE: "TYPE_MESSAGE";
    readonly TYPE_BYTES: "TYPE_BYTES";
    readonly TYPE_UINT32: "TYPE_UINT32";
    readonly TYPE_ENUM: "TYPE_ENUM";
    readonly TYPE_SFIXED32: "TYPE_SFIXED32";
    readonly TYPE_SFIXED64: "TYPE_SFIXED64";
    readonly TYPE_SINT32: "TYPE_SINT32";
    readonly TYPE_SINT64: "TYPE_SINT64";
};
export declare type FieldDescriptorProto_Type = typeof FieldDescriptorProto_Type[keyof typeof FieldDescriptorProto_Type];
export declare const FieldDescriptorProto_Label: {
    readonly LABEL_OPTIONAL: "LABEL_OPTIONAL";
    readonly LABEL_REQUIRED: "LABEL_REQUIRED";
    readonly LABEL_REPEATED: "LABEL_REPEATED";
};
export declare type FieldDescriptorProto_Label = typeof FieldDescriptorProto_Label[keyof typeof FieldDescriptorProto_Label];
export interface OneofDescriptorProto {
    name: string;
    options: OneofOptions | undefined;
}
export interface EnumDescriptorProto {
    name: string;
    value: EnumValueDescriptorProto[];
    options: EnumOptions | undefined;
}
export interface EnumValueDescriptorProto {
    name: string;
    number: number;
    options: EnumValueOptions | undefined;
}
export interface ServiceDescriptorProto {
    name: string;
    method: MethodDescriptorProto[];
    options: ServiceOptions | undefined;
}
export interface MethodDescriptorProto {
    name: string;
    input_type: string;
    output_type: string;
    options: MethodOptions | undefined;
    client_streaming: boolean;
    server_streaming: boolean;
}
export interface FileOptions {
    java_package: string;
    java_outer_classname: string;
    java_multiple_files: boolean;
    /** @deprecated */
    java_generate_equals_and_hash: boolean;
    java_string_check_utf8: boolean;
    optimize_for: FileOptions_OptimizeMode;
    go_package: string;
    cc_generic_services: boolean;
    java_generic_services: boolean;
    py_generic_services: boolean;
    deprecated: boolean;
    cc_enable_arenas: boolean;
    objc_class_prefix: string;
    csharp_namespace: string;
    uninterpreted_option: UninterpretedOption[];
}
export declare const FileOptions_OptimizeMode: {
    readonly SPEED: "SPEED";
    readonly CODE_SIZE: "CODE_SIZE";
    readonly LITE_RUNTIME: "LITE_RUNTIME";
};
export declare type FileOptions_OptimizeMode = typeof FileOptions_OptimizeMode[keyof typeof FileOptions_OptimizeMode];
export interface MessageOptions {
    message_set_wire_format: boolean;
    no_standard_descriptor_accessor: boolean;
    deprecated: boolean;
    map_entry: boolean;
    uninterpreted_option: UninterpretedOption[];
}
export interface FieldOptions {
    ctype: FieldOptions_CType;
    packed: boolean;
    jstype: FieldOptions_JSType;
    lazy: boolean;
    deprecated: boolean;
    weak: boolean;
    uninterpreted_option: UninterpretedOption[];
}
export declare const FieldOptions_CType: {
    readonly STRING: "STRING";
    readonly CORD: "CORD";
    readonly STRING_PIECE: "STRING_PIECE";
};
export declare type FieldOptions_CType = typeof FieldOptions_CType[keyof typeof FieldOptions_CType];
export declare const FieldOptions_JSType: {
    readonly JS_NORMAL: "JS_NORMAL";
    readonly JS_STRING: "JS_STRING";
    readonly JS_NUMBER: "JS_NUMBER";
};
export declare type FieldOptions_JSType = typeof FieldOptions_JSType[keyof typeof FieldOptions_JSType];
export interface OneofOptions {
    uninterpreted_option: UninterpretedOption[];
}
export interface EnumOptions {
    allow_alias: boolean;
    deprecated: boolean;
    uninterpreted_option: UninterpretedOption[];
}
export interface EnumValueOptions {
    deprecated: boolean;
    uninterpreted_option: UninterpretedOption[];
}
export interface ServiceOptions {
    deprecated: boolean;
    uninterpreted_option: UninterpretedOption[];
}
export interface MethodOptions {
    deprecated: boolean;
    uninterpreted_option: UninterpretedOption[];
}
export interface UninterpretedOption {
    name: UninterpretedOption_NamePart[];
    identifier_value: string;
    positive_int_value: number;
    negative_int_value: number;
    double_value: number;
    string_value: string;
    aggregate_value: string;
}
export interface UninterpretedOption_NamePart {
    name_part: string;
    is_extension: boolean;
}
export interface SourceCodeInfo {
    location: SourceCodeInfo_Location[];
}
export interface SourceCodeInfo_Location {
    path: number[];
    span: number[];
    leading_comments: string;
    trailing_comments: string;
    leading_detached_comments: string[];
}
export interface GeneratedCodeInfo {
    annotation: GeneratedCodeInfo_Annotation[];
}
export interface GeneratedCodeInfo_Annotation {
    path: number[];
    source_file: string;
    begin: number;
    end: number;
}
//# sourceMappingURL=descriptor.d.ts.map